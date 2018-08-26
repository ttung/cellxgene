// jshint esversion: 6
import { combineReducers, createStore, applyMiddleware } from "redux";
import updateURLMiddleware from "../middleware/updateURLMiddleware";
import updateCellColors from "../middleware/updateCellColors";

import thunk from "redux-thunk";

import differential from "./differential";
import responsive from "./responsive";
import universe from "./universe";
import controls2 from "./controls2";

const Reducer = combineReducers({
  differential,

  // New Redux refactor
  universe,
  responsive,
  controls2
});

let store = createStore(
  Reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  applyMiddleware(thunk, updateURLMiddleware, updateCellColors)
);

export default store;
