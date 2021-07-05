import { call, fork, put } from 'redux-saga/effects'
import EthClient from '../../../../lib/EthClient';
import * as Constants from '../../../../constants';
import * as Actions from '../../../actions';
import * as Helpers from './helpers';

let ethClient;

export function* init() {
  ethClient = new EthClient({ethereum: window.ethereum});
  const connectedAccount = yield call([ethClient, 'init']);
  if (ethClient.isWeb3Available) {
    yield fork(Helpers.startWatchingForEthereumEvents, ethClient.ethereum);
  }

  if (connectedAccount) {
    const chainId = yield call([ethClient, 'getChainId']);
    yield put(Actions.web3.updateNetworkStatus({
      status: Constants.web3.networkStatus.CONNECTED,
      account: connectedAccount,
      networkId: chainId
    }));
  }

  yield put(Actions.web3.initWeb3Success({ web3Client: ethClient }));
}

export function* installWallet() {
  // @TODO
}

export function* connectWallet() {
  try {
    yield put(Actions.web3.updateNetworkStatus({ status: Constants.web3.networkStatus.CONNECTING }));
    yield call([ethClient, 'connectWallet']);
  } catch (error) {
    yield put(Actions.web3.updateNetworkStatus({ status: Constants.web3.networkStatus.NOT_CONNECTED }));
    
    let bodyText;
    if (error.code === -32002) {
      bodyText = 'There was an error connecting to MetaMask. Please try connecting manually to MetaMask by clicking on the MetaMask wallet.';
    } else {
      bodyText = error;
    }

    const modalProps = {
      title: 'Failed to connect',
      bodyText
    };
    yield put(Actions.ui.showModal(modalProps));
  }
}