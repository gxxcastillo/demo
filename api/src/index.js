require('dotenv').config()
const { ethers } = require('ethers');
const express = require('express');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const util = require('util');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Artist = require("./db/models/Artist") // new
const Track = require("./db/models/Track")
const Band = require ("./db/models/Band")
const fleekStorage = require('@fleekhq/fleek-storage-js')
const fetch = require('node-fetch');


const Network = require( './contracts/network.json');
const UltraSoundMusicABI = require( './contracts/UltraSoundMusicABI.json');

const sentryDsn = process.env.SENTRY_ENABLED === 'true' ? process.env.SENTRY_DSN : '';
const nullAddress = "0x0000000000000000000000000000000000000000";


// start express app
const app = express();
const port = 9001;

Sentry.init({
  dsn: sentryDsn,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


const customHttpProvider = new ethers.providers.JsonRpcProvider(process.env.ETH_PROVIDER);

let contract = new ethers.Contract(
  // TODO: improve next line
  Network.development.UltraSoundMusic,
  UltraSoundMusicABI,
  customHttpProvider,
)

// connect to DB 

// Uncomment the following line to have the db cleared out upon connecting
mongoose.connect(process.env.MONGO_DB, {useNewUrlParser: true, useUnifiedTopology: true}, () => mongoose.connection.db.dropDatabase());
//mongoose.connect(process.env.MONGO_DB, {useNewUrlParser: true, useUnifiedTopology: true});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('open', console.log.bind(console, "connected to db"))
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


//sql.query = util.promisify(sql.query);
// support /post
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const handleArtistToken = async(from,to,id) =>{
  console.log("handle artist being called")
  if(from === nullAddress){
    console.log("handling new artist token")
    const metadataUri = await contract.uri(id) 
    const metadata = await fetch(metadataUri).then(result => result.json())
    const artist = new Artist({
      tokenId: id,
      artistDNA: metadata.artistDNA,
      owner: to,
      metadataUri,
      tokenType:"artist",
      artistDNA: metadata.artistDNA,
      name:metadata.name,
      description: metadata.description
    })
    return artist.save()
  }
}

const handleBandToken = async(id, artistId, owner) =>{
    console.log("handling new band token id", id.toNumber())
    //const metadataUri = await contract.uri(id)
    const metadataUri = await contract.uri(id) 
    const metadata = await fetch(metadataUri).then(result => result.json())
    const band = new Band({
      tokenId: id.toNumber(),
      creator: Number(artistId),
      owner,
      metadataUri,
      members: [Number(artistId)],
      active: false,
      tokenType:"band",
      name:metadata.name,
      description: metadata.description
    })
    return band.save()
}

const handleJoinBand = async(id, artistId, owner) =>{
  console.log("handling join band id =", id.toNumber())
  const band = await Band.findOne({tokenId: id.toNumber() })
  const currMembers = band.members;
  currMembers.push(Number(artistId))
  band.active = currMembers.length === 4 ? true:false;
  return band.save()
}


const handleTrackToken = async(trackId, bandId, artistId, owner) =>{
  console.log("handling new Track")
    const metadataUri = await contract.uri(trackId)
    const metadata = await fetch(metadataUri).then(result => result.json())
    const track = new Track({
      tokenId: trackId,
      creator: Number(artistId),
      owner,
      metadataUri,
      band: bandId,
      tokenType:"track",
      name:metadata.name,
      description: metadata.description
    })
    return track.save()
}

app.get('/api/artists', async (req, res) => {
  const artists = await Artist.find()
	res.send(artists)
});

app.get('/api/bands', async (req, res) => {
  const bands = await Band.find()
	res.send(bands)
});

app.get('/api/tracks', async (req, res) => {
  const tracks = await Track.find()
	res.send(tracks)
});

app.get('/api/tokens', async(req,res)=> {
  const tracks = await Track.find()
  const bands = await Band.find()
  const artists = await Artist.find()

  const merged = [].concat.apply([], [tracks,bands,artists]);
  res.send(merged)
})

app.post("/api/create_metadata_uri", async(req,res)=> {

  const obj = req.body

  const key = `${Date.now()}`

  const {publicUrl: metadataUri} = await fleekStorage.upload({
    apiKey: process.env.FLEEK_API_KEY,
    apiSecret: process.env.FLEEK_API_SECRET,
    key,
    data: JSON.stringify(obj)
  });

  res.send({metadataUri})
})

app.listen(port, async () => {
    // Connect to the network

    const providerUrl = 'http://localhost:8545';
    const customHttpProvider = new ethers.providers.JsonRpcProvider(providerUrl);

    let contract = new ethers.Contract(
  // TODO: improve next line
      Network.development.UltraSoundMusic,
      UltraSoundMusicABI,
      customHttpProvider,
    )

    
  
    contract.on("TransferSingle", async (operator, from, to, id, value, event) => {

      console.log(`new token ${id}`)

      if(id <= 80){
        //handle artist token write id, to as owner and metadataURI
        await handleArtistToken(from,to,id)
        console.log(`artist token id = ${id} transfered`)
      } else if (id > 100 && id < 100000) {
        //handle band token write iid, to as owner and metaddataURI
        console.log(`band token id = ${id} transfered`)
      } else if (id > 100000) {
        //handle track token write id, to as owner and metadataURI
        console.log(`track token id = ${id} transfered`)
      }
    });

    contract.on("bandCreate", async (id, artistId, owner, event) => {
      await handleBandToken(id, artistId, owner)
    });

    contract.on("bandJoined", async (id, artistId, owner, event) => {
      console.log(`band was joined by ${owner} id = ${id}`)
      await handleJoinBand(id, artistId, owner)
    });

    contract.on("trackCreated", async (trackId,bandId, artistId, owner) => {
      await handleTrackToken(trackId, bandId, artistId, owner)
      console.log(`track was created by ${owner} id = ${artistId}`)

    });

    console.log(`Example app listening on port ${port}!`);
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

