exports.assign = function(obj, props) {
  for (let i in props) {
    obj[i] = props[i];
  }
  return obj;
};
