const fs = require('fs')

exports.default = function (buildResult) {
  try {
    console.log('[artifact build completed] rename artifact file...')
    if (!buildResult.file.includes(' ')) {
      return
    }

    let oldFilePath = buildResult.file
    if (oldFilePath.includes('-portable') && !oldFilePath.includes('-x64') && !oldFilePath.includes('-arm64')) {
      console.log('[artifact build completed] delete portable file:', oldFilePath)
      fs.unlinkSync(oldFilePath)
      return
    }
    const newfilePath = oldFilePath.replace(/ /g, '-')
    fs.renameSync(oldFilePath, newfilePath)
    buildResult.file = newfilePath
    console.log(`[artifact build completed] rename file ${oldFilePath} to ${newfilePath} `)
  } catch (error) {
    console.error('Error renaming file:', error)
  }
}
