import { put, takeEvery } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'
import * as Constants from '../../../constants';
import * as Actions from '../../actions';
import * as Utils from '../../../utils';

const coreEventListeners = {
  [Constants.web3.providerEventNames.ACCOUNTS_CHANGED]: getAccountChangedAction,
  [Constants.web3.providerEventNames.CHAIN_CHANGED]: getChainChangedAction
}

export function* startWatchingForEthereumEvents(ethereum) {
  const ethereumEventChannel = createEthereumEventChannel(ethereum)
  yield takeEvery(ethereumEventChannel, function* (action) {
    yield put(action);
  });
}

export function getAccountChangedAction(accounts) {
  const account = accounts?.[0];
  if (account) {
    return Actions.web3.updateNetworkStatus(Constants.web3.networkStatus.CONNECTED, account);
  } else {
    return Actions.web3.updateNetworkStatus(Constants.web3.networkStatus.NOT_CONNECTED);
  }
}

export function getChainChangedAction(chainId) {
  return Actions.web3.updateNetworkChain(chainId);
}

export function createEthereumEventChannel(ethereum) {
  return eventChannel((emit) => {
    const boundEventListeners = Utils.web3.bindCoreEventListeners(emit, ethereum, coreEventListeners);
    return () => {  
      Utils.web3.removeCoreEventListeners(ethereum, boundEventListeners);
    }
  })
}