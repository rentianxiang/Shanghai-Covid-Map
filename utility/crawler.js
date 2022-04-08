const axios = require('axios')
const cheerio = require('cheerio')



const dataDict = {
    '黄浦区': [],
    '徐汇区': [],
    '长宁区': [],
    '静安区': [],
    '普陀区': [],
    '虹口区': [],
    '杨浦区': [],
    '闵行区': [],
    '宝山区': [],
    '嘉定区': [],
    '浦东新区': [],
    '金山区': [],
    '松江区': [],
    '青浦区': [],
    '奉贤区': [],
    '崇明区': [],
}

const dataOutput = []



async function main(date, url) {
    if (!date || !url) { console.log('Crawler缺少信息!'); return }
    const html = (await axios.get(url)).data
    const $ = cheerio.load(html)
    let districtPointer
    // 解析HTML
    $('#js_content').find('section').each((_, element) => {
        const attrDataId = $(element).attr('data-id')
        const attrDataRole = $(element).attr('data-role')
        if (attrDataRole === 'title') {
            districtPointer = $(element).text()
        } else if (attrDataId === '72469') {
            const paragraphs = $(element).find('p')
            for (let i = 1; i < paragraphs.length - 1; i++) { //去掉首尾无用信息
                const address = $(paragraphs[i]).text().slice(0, -1) //去掉字符串末尾逗号
                districtPointer && address && dataDict[districtPointer].push(address)
            }
        }
    })
    // 数据整理
    for (const [district, streets] of Object.entries(dataDict)) {
        streets.forEach(street => dataOutput.push({ date, district, street }))
    }
    return dataOutput
}

// async function main(date, url) {
//     if (!date || !url) { return }
//     const html = (await axios.get(url)).data
//     const $ = cheerio.load(html)
//     let districtPointer
//     // 读取HTML
//     $('#ivs_content').children().each((index, element) => {
//         const title = $(element).has('strong').text()
//         if (title) {
//             districtPointer = title
//         } else if (districtPointer && $(element).children().length === 1) {
//             const content = $(element).text().slice(0, -1)
//             content && dataDict[districtPointer].push(content)
//         }
//     })
//     // 数据整理
//     for (const [district, streets] of Object.entries(dataDict)) {
//         streets.pop() // 最后一项是'已对相关居住地落实终末消毒措施',应该删除
//         for (const street of streets) {
//             dataOutput.push({ date, district, street })
//         }
//     }
//     return dataOutput
// }

module.exports = main