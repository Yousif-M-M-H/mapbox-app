import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGO_URI as string
if (!uri) throw new Error('MONGO_URI not found in environment')

const client = new MongoClient(uri)
let db: any = null

export async function connectToMongo() {
  if (!db) {
    await client.connect()
    db = client.db() // uses the default database from URI
    console.log('✅ Connected to MongoDB')
  }
  return db
}
