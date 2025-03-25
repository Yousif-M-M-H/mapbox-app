import { connectToMongo } from '../db/connect'

export async function getTestCollectionData() {
  const db = await connectToMongo()
  const collection = db.collection('locations') // Example collection
  const results = await collection.find({}).limit(5).toArray()
  return results
}
