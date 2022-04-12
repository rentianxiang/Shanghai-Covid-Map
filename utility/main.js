const fs = require('fs')
const path = require('path')
require('dotenv').config()
const axios = require('axios')
const { MongoClient, ObjectId } = require('mongodb');
const mongoClient = new MongoClient(`mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@localhost:27017`);
const crawler = require('./crawler')

const date = '2022-04-11'
const url = 'https://mp.weixin.qq.com/s/vxFiV2HeSvByINUlTmFKZA'

main()
async function main() {
    await initDb()
    await getRawData()
    await processRawData()
    await exportData()
    await mongoClient.close()
}

// 连接数据库
async function initDb() {
    await mongoClient.connect()
    db = mongoClient.db('covid') // DB设定为全局变量
    db.collection('shanghai').createIndex({ location: '2dsphere' })
}

// 获取并存储数据
async function getRawData() {
    const rawData = await crawler(date, url)
    await db.collection('shanghai').insertMany(rawData)
    return
}

// 从数据库逐条读取数据并添加位置信息
async function processRawData() {
    let count = 0
    const data = await db.collection('shanghai').find({ location: { $exists: false } }).toArray()
    for (const { _id, district, street } of data) {
        const location = await getLocation('上海市', district, street)
        await db.collection('shanghai').updateOne({ _id: ObjectId(_id) }, { $set: { location } })
        await new Promise(resolve => setTimeout(resolve, 150)) // 防止访问过快
        count += 1
        console.log('count', count)
    }
}

// 导出数据
async function exportData() {
    const data = await db.collection('shanghai').find().project({ _id: 0, d: '$district', s: '$street', lng: { $arrayElemAt: ['$location.coordinates', 0] }, lat: { $arrayElemAt: ['$location.coordinates', 1] } }).toArray()
    fs.writeFileSync(path.join(__dirname, '../data.json'), JSON.stringify(data))
}

// 使用腾讯地图API解析地址
async function getLocation(city, district, street) {
    const address = encodeURIComponent(`${city}${district}${street}`)
    const { result } = (await axios.get(`https://apis.map.qq.com/ws/geocoder/v1/?address=${address}&key=${process.env.QQMAPKEY}`)).data
    const longitude = result.location.lng
    const latitude = result.location.lat
    return { type: 'Point', coordinates: [longitude, latitude] }
}