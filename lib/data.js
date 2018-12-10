const fs = require('fs');
const path = require('path');
const debug = require('./debug');
const util = require('util');

const openFile = util.promisify(fs.open);
const readFile = util.promisify(fs.readFile);
const closeFile = util.promisify(fs.close);
const writeFile = util.promisify(fs.writeFile);
const trunccateFile = util.promisify(fs.truncate);
const unlinkFile = util.promisify(fs.unlink);
const readDir = util.promisify(fs.readdir);
const renameFile = util.promisify(fs.rename);

var lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

/**
 * Create new file in case it not exists yet
 * @return: None
 * @required_params:
 *  - dir - folder name
 *  - fname - file name
 *  - data - the file content
 * @optional_params: None
 */
lib.create = async (dir, fname, data) => {
    const dsc = await openFile(lib.baseDir+dir+'/'+fname+'.json', 'wx');
    debug.info("lib.create: ", lib.baseDir+dir+'/'+fname+'.json');
    await writeFile(dsc, JSON.stringify(data));
    await closeFile(dsc);
};

/**
 * read the existing file
 * @return: the file content
 * @required_params: 
 *  - dir - folder name
 *  - fname - filename
 * @optional_params: None
 */
lib.read = async (dir, fname) => {
    const dsc = await openFile(lib.baseDir+dir+'/'+fname+'.json', 'r');
    if(dsc) {
        const data = await readFile(dsc, 'utf8');
        await closeFile(dsc);
        return JSON.parse(data);
    }
    return null;
};

/**
 * update the content of the existing file
 * @return: None
 * @required_params:
 *  - dir - folder name
 *  - fname - filename
 *  - data - the file content
 * @optional_params: None
 */
lib.update = async (dir, fname, data) => {
    const dsc = await openFile(lib.baseDir+dir+'/'+fname+'.json', 'r+');
    if(dsc) {
            await trunccateFile(dsc);
            await writeFile(dsc, JSON.stringify(data));
            await closeFile(dsc);
    }
};

/**
 * delete the existing file
 * @return: None
 * @required_params: 
 *  - dir - folder name
 *  - fname - filename
 * @optional_params: None
 */
lib.delete = async (dir, fname) => {
    debug.info('Delete file: ', lib.baseDir+dir+'/'+fname+'.json');
    await unlinkFile(lib.baseDir+dir+'/'+fname+'.json');
};

/**
 * read the folder
 * @return: list of json files
 * @required_params: 
 *  - dir - folder name
 * @optional_params: None
 */
lib.list = async (dir) => {
    const data = await readDir(lib.baseDir+dir+'/');
    var trimmedFileNames = [];
    data.forEach(fileName => {
        trimmedFileNames.push(fileName.replace('.json', ''));
    });
    return trimmedFileNames;
};

module.exports = lib;