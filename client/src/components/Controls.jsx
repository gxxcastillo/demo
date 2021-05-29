import React  from 'react';
import Button from 'react-bootstrap/Button';
import { ethers } from 'ethers';
import { togglePlayback, downloadAudio } from '../audio'
import * as metaMask from '../utils/metaMask';
import ArtistAbi from '../web3/ArtistAbi';

export class Controls extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      nextPlayState: true
    }
  }

  async createArtist() {
    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  
    const provider = metaMask.getProvider()
    let contract = new ethers.Contract(contractAddress, ArtistAbi, provider);
    let writeContract = new ethers.Contract(contractAddress, ArtistAbi, provider.getSigner());
    try {
      const fakeTokenId = `${Date.now()}`
      await writeContract.createArtist(fakeTokenId);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }

  onClickCreateArtist = () => {
    this.createArtist();
  }
  
  render() {
    return (
      <div className="Controls">
        <Button onClick={this.onClickCreateArtist}>Create Artist</Button>
        <Button if style={{ width: "250px", height: "40px", margin: "8px" }} onClick={() => {
          togglePlayback(this.state.nextPlayState)
          this.setState({ nextPlayState: !this.state.nextPlayState })
        }}>{this.state.nextPlayState ? 'Play Audio' : 'Stop Audio'}</Button>
        <Button if style={{ width: "250px", height: "40px", margin: "8px" }} onClick={() => {
          downloadAudio()
        }}>Download Audio</Button>
      </div>
    );    
  }
}

export default Controls;