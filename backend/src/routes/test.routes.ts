import express from 'express'
import { getTestCollectionData } from '../services/mongoService'

const router = express.Router()

router.get('/test', async (req, res) => {
  try {
    const data = await getTestCollectionData()
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
