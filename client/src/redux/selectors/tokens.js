import { createSelector } from '@reduxjs/toolkit';
import * as Constants from '../../constants';
import tokensAdapter from '../utils/tokensAdapter';

const tokenSelectors = tokensAdapter.getSelectors((state) => state.tokens)

export const {
  selectIds: selectTokenIds, 
  selectEntities: selectTokenEntities,
  selectAll: selectAllTokenEntities,
  selectTotal: selectTokenTotal,
  selectById: selectTokenById
} = tokenSelectors;

export const selectPlayableSourceByTokenId = createSelector(
  selectTokenById,
  (token) => token.metadata.artistDNA // @TODO suport tracks
)

export const selectAllBandEntities = createSelector(
  selectAllTokenEntities,
  (tokens) => tokens.filter((token) => token.type === Constants.entities.tokenType.BAND)
);

export const selectAllArtistEntities = createSelector(
  selectAllTokenEntities,
  (tokens) => tokens.filter((token) => token.type === Constants.entities.tokenType.ARTIST)
);

export const selectAllTrackEntities = createSelector(
  selectAllTokenEntities,
  (tokens) => tokens.filter((token) => token.type === Constants.entities.tokenType.TRACKS)
);