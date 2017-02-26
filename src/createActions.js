import identity from 'lodash/identity';
import camelCase from './camelCase';
import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import every from 'lodash/every';
import values from 'lodash/values';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import createAction from './createAction';
import invariant from 'invariant';
import { flattenActions, unflattenActions } from './namespaceActions';

export default function createActions(actionsMap, ...identityActions) {
  invariant(
    identityActions.every(isString) &&
    (isString(actionsMap) || isPlainObject(actionsMap)),
    'Expected optional object followed by string action types'
  );
  if (isString(actionsMap)) {
    return fromIdentityActions([actionsMap, ...identityActions]);
  }
  return unflattenActions({
    ...fromActionsMap(actionsMap),
    ...fromIdentityActions(identityActions)
  });
}

function isValidActionsMapValue(actionsMapValue) {
  if (isFunction(actionsMapValue)) {
    return true;
  } else if (isArray(actionsMapValue)) {
    const [payload = identity, meta] = actionsMapValue;

    return isFunction(payload) && isFunction(meta);
  } else if (isPlainObject(actionsMapValue)) {
    if (isEmpty(actionsMapValue)) {
      return false;
    }
    return every(values(actionsMapValue), isValidActionsMapValue);
  }
  return false;
}

function fromActionsMap(actionsMap) {
  Object.keys(actionsMap).forEach(type => invariant(
    isValidActionsMapValue(actionsMap[type]),
    'Expected function, undefined, or array with payload and meta ' +
    `functions for ${type}`
  ));
  const flattenedActionsMap = flattenActions(actionsMap);
  return Object.keys(flattenedActionsMap).reduce((actionCreatorsMap, namespacedType) => {
    const actionsMapValue = flattenedActionsMap[namespacedType];
    const actionCreator = isArray(actionsMapValue)
      ? createAction(namespacedType, ...actionsMapValue)
      : createAction(namespacedType, actionsMapValue);
    return { ...actionCreatorsMap, [camelCase(namespacedType)]: actionCreator };
  }, {});
}

function fromIdentityActions(identityActions) {
  return fromActionsMap(identityActions.reduce(
    (actionsMap, actionType) => ({ ...actionsMap, [actionType]: identity })
  , {}));
}
