// jshint esversion: 6
import uri from "urijs";
import * as globals from "../globals";
import _ from "lodash";
import { parseRGB } from "../util/parseRGB";
import * as d3 from "d3";
import { interpolateViridis } from "d3-scale-chromatic";

/*
  https://medium.com/@jacobp100/you-arent-using-redux-middleware-enough-94ffe991e6
  storeInstance => functionToCallWithAnActionThatWillSendItToTheNextMiddleware => actionThatDispatchWasCalledWith => valueToUseAsTheReturnValueOfTheDispatchCall
*/

/*
  What this file does:

  1. fire a filter action anywhere in the app
  2. ** this middleware checks to see the state of all the currently selected filters, including the new one
  3. ** create updated selection from a copy of all the cells presently on the client (this may be a subset of 'all')
  4. ** append that new selection to the action so that it magically appears in the reducer just because the action was fired

  This is nice because we keep a lot of filtering business logic centralized (what it means in practice to be selected)
*/

const updateCellColorsMiddleware = store => {
  return next => {
    return action => {
      const s = store.getState();

      /* this is a hardcoded map of the things we need to keep an eye on and update global cell selection in response to */
      const filterJustChanged =
        action.type === "color by expression" ||
        action.type === "color by continuous metadata" ||
        action.type === "color by categorical metadata";

      if (!filterJustChanged || !s.controls2.world.obsAnnotations) {
        return next(
          action
        ); /* if the cells haven't loaded or the action wasn't a color change, bail */
      }

      const obsAnnotations = s.controls2.world.obsAnnotations;
      let colorScale;
      let colorsByName = new Array(obsAnnotations.length);
      let colorsByRGB = new Array(obsAnnotations.length);

      /*
         in plain language...

         (a) once the cells have loaded.
         (b) each time a user changes a color control we need to update cellsMetadata colors

         This is available to all the draw functions as cell["__color__"] and cell["__colorRGB__"]
      */

      if (action.type === "color by categorical metadata") {
        colorScale = d3.scaleOrdinal().range(globals.ordinalColors);

        for (let i = 0; i < obsAnnotations.length; i++) {
          const obs = obsAnnotations[i];
          const c = colorScale(obs[action.colorAccessor]);
          colorsByName[i] = c;
          colorsByRGB[i] = parseRGB(c);
        }
      }

      if (action.type === "color by continuous metadata") {
        colorScale = d3
          .scaleLinear()
          .domain([0, action.rangeMaxForColorAccessor])
          .range([1, 0]);

        for (let i = 0; i < obsAnnotations.length; i++) {
          const obs = obsAnnotations[i];
          let c = interpolateViridis(colorScale(obs[action.colorAccessor]));
          colorsByName[i] = c;
          colorsByRGB[i] = parseRGB(c);
        }
      }

      if (action.type === "color by expression") {
        const { gene, data } = action;
        const expression = data[gene]; // Float32Array
        colorScale = d3
          .scaleLinear()
          .domain([_.min(expression), _.max(expression)])
          .range([
            1,
            0
          ]); /* invert viridis... probably pass this scale through to others */

        for (let i = 0, len = expression.length; i < len; i += 1) {
          const c = interpolateViridis(colorScale(expression[i]));
          colorsByName[i] = c;
          colorsByRGB[i] = parseRGB(c);
        }
      }

      /*
        append the result of all the filters to the action the user just triggered
      */
      const modifiedAction = Object.assign({}, action, {
        colors: { name: colorsByName, rgb: colorsByRGB },
        colorScale
      });

      return next(modifiedAction);
    };
  };
};

export default updateCellColorsMiddleware;
