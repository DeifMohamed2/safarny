function applyIdVirtual(schema) {
  schema.set('toJSON', { virtuals: true, versionKey: false });
  schema.set('toObject', { virtuals: true, versionKey: false });
  schema.virtual('id').get(function idVirtual() {
    return this._id;
  });
}

module.exports = { applyIdVirtual };
