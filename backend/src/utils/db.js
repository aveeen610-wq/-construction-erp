const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const stores = {};

class Model {
  constructor(name) {
    this.name = name;
    this._store = Datastore.create({ filename: path.join(dataDir, `${name}.db`), autoload: true });
  }

  newId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  _doc(d) {
    if (!d) return d;
    d.toObject = () => ({ ...d });
    d.save = async () => {
      await this._store.update({ _id: d._id }, { $set: { ...d, updatedAt: new Date() } });
      return d;
    };
    return d;
  }

  _docs(arr) {
    return arr.map(d => this._doc(d));
  }

  async find(filter = {}) {
    const docs = await this._store.find(filter);
    return this._docs(docs);
  }

  async findOne(filter = {}) {
    const doc = await this._store.findOne(filter);
    return this._doc(doc);
  }

  async findById(id) {
    if (!id) return null;
    const doc = await this._store.findOne({ _id: id });
    return this._doc(doc);
  }

  async create(data) {
    const doc = await this._store.insert({
      ...data, _id: this.newId(), createdAt: new Date(), updatedAt: new Date()
    });
    return this._doc(doc);
  }

  async findOneAndUpdate(filter, update, opts = {}) {
    const doc = await this._store.findOne(filter);
    if (!doc) return null;
    const setData = { ...update, updatedAt: new Date() };
    await this._store.update(filter, { $set: setData });
    const result = opts.new !== false ? await this._store.findOne(filter) : { ...doc, ...update };
    return this._doc(result);
  }

  async findByIdAndUpdate(id, update, opts = {}) {
    return this.findOneAndUpdate({ _id: id }, update, opts);
  }

  async findByIdAndDelete(id) {
    const doc = await this._store.findOne({ _id: id });
    if (!doc) return null;
    await this._store.remove({ _id: id }, {});
    return this._doc(doc);
  }

  async deleteOne(filter) {
    await this._store.remove(filter, {});
    return { deletedCount: 1 };
  }

  async countDocuments(filter = {}) {
    return this._store.count(filter);
  }

  async insertMany(arr) {
    const docs = await this._store.insert(arr.map(d => ({
      ...d, _id: this.newId(), createdAt: new Date(), updatedAt: new Date()
    })));
    return this._docs(docs);
  }

  async updateMany(filter, update) {
    await this._store.update(filter, { $set: { ...update, updatedAt: new Date() } }, { multi: true });
    return { modifiedCount: 1 };
  }

  async paginate(filter = {}, { page = 1, limit = 20, sort = { createdAt: -1 } } = {}) {
    const total = await this.countDocuments(filter);
    const skip = (page - 1) * limit;
    const docs = await this._store.find(filter);
    const sorted = docs.sort((a, b) => {
      const k = Object.keys(sort)[0] || 'createdAt';
      return sort[k] === -1 ? new Date(b[k]) - new Date(a[k]) : new Date(a[k]) - new Date(b[k]);
    });
    const paged = sorted.slice(skip, skip + limit);
    return { docs: this._docs(paged), total, page, pages: Math.ceil(total / limit) };
  }
}

const models = {};

function getModel(name) {
  if (!models[name]) {
    models[name] = new Model(name);
  }
  return models[name];
}

module.exports = { getModel };
