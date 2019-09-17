if (true){
    console.log = function () {
        return;
    }
    var CLIshush = {reporters: 'htmlfull', timeoutRequest: 100};
}

process.on('unhandledRejection', function(err) {
    console.log(err);
}),

module.exports = {
    request: request = require('request-promise'),
    chai: chai = require('chai'),
    sinon: sinon = require('sinon'),
    expect: expect = chai.expect,
    fs: fs = require('fs'),
    net: net = require('net'),
    async: async = require('async'),
    process: process = require('process'),

    api_key: api_key = '?apikey=API_KEY_POSTMAN',
    api_collectionsEndpoint: api_collectionsEndpoint = 'https://api.getpostman.com/collections/?apikey=API_KEY_POSTMAN',
    api_environmentsEndpoint: api_environmentsEndpoint = 'https://api.getpostman.com/environments/?apikey=API_KEY_POSTMAN',
    api_snippets: api_snippets = 'https://api.getpostman.com/collections/8804262-13f4c16b-dcbb-4440-8198-d60f9061eaff?apikey=API_KEY_POSTMAN',
    api_test: api_test = 'https://api.getpostman.com/collections/8804262-b6a908f0-d4a8-4a5e-9ddc-96fed552e863?apikey=API_KEY_POSTMAN',
    api_yolo: api_yolo = 'https://api.getpostman.com/collections/8804262-c4129d67-4b56-44d1-a7cc-3c3da87ec73a?apikey=API_KEY_POSTMAN',
    api_UAT: api_UAT = 'https://api.getpostman.com/environments/8804262-7b563f42-8bed-4ed7-aba7-7eca1e0d6230?apikey=API_KEY_POSTMAN',
    api_SIT: api_SIT = 'https://api.getpostman.com/environments/8804262-d98686c9-d6b6-4be1-b0cb-a2adbb3aa4c4?apikey=API_KEY_POSTMAN',
    local_dataFolder: local_dataFolder = './data/',
    local_collectionsFolder: local_collectionsFolder = './collections/',
    local_environmentsFolder: local_environmentsFolder = './environments/',
    local_dataJson: local_dataJson = local_dataFolder + 'data.json',
    local_dataCsv: local_dataCsv = local_dataFolder + 'data.csv',
    local_snippets: local_snippets = local_collectionsFolder + 'snippets.postman_collection.json',
    local_test: local_test = local_collectionsFolder + 'test.postman_collection.json',
    local_yolo: local_yolo = local_collectionsFolder + 'yolo.postman_collection.json',
    local_UAT: local_UAT = local_environmentsFolder + 'UAT.postman_environment.json',
    local_SIT: local_SIT = local_environmentsFolder + 'SIT.postman_environment.json',

    copyTest: copyTest = {
        collections: async function (amount, options) {
            while (amount) {
                fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', options.folders.collections + amount + '_col.json');
                amount--;
            }
        },
        environments: async function (amount, options) {
            while (amount) {
                fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', options.folders.environments + amount + '_env.json');
                amount--;
            }
        },
        data: async function (amount, options, fileExtension) {
            while (amount) {
                fs.copyFileSync('./test/testdata/data/data.json', options.folders.data + amount 
                    + '_data' + (fileExtension ? fileExtension : '.json'));
                amount--;
            }
        },
        templates: async function (options) {
            fs.copyFileSync('./test/testdata/templates/htmlreqres.hbs', options.folders.templates + 'htmlreqres.hbs');
        },
        all: async function (amount, options) {
            this.collections(amount, options);
            this.environments(amount, options);
            this.data(amount, options);
            this.templates(options);
        }
    },

    optionsFactory: optionsFactory = function () {
        return runnerOptions = {
            parallelFolderRuns: false,
            folders: {
                collections: './test/collections/',
                environments: './test/environments/',
                reports: './test/reports/',
                data: './test/data/',
                templates: './test/templates/'
            },
            newmanOptions: CLIshush,
            reporter_template: 'htmlreqres.hbs',
            anonymizeFilter: 'rebelia',
            specific_collection_items_to_run: ['folder1', 'LUZEM']
        };
    },
    
    collectionFactory: collectionFactory = function (amount) {
        let testData = new Array();
        while (amount) {
            let randomName = Math.floor((Math.random() * 9999) + 1) + '_col';
            testData.push({
                address: './collections folder/' + randomName + '.json', content: 'test content', name: randomName, folders:
                    ['f1', 'f2', 'f3']
            });
            amount--;
        }
        return testData;
    },
    
    environmentFactory: environmentFactory = function (amount) {
        let testData = new Array();
        while (amount) {
            let randomName = Math.floor((Math.random() * 9999) + 1) + '_env';
            testData.push({ address: './environments folder/' + randomName + '.json', content: 'test content', name: randomName });
            amount--;
        }
        return testData;
    },
    
    dataFactory: dataFactory = function (amount, fileType) {
        let testData = new Array();
        while (amount) {
            let randomName = Math.floor((Math.random() * 9999) + 1) + '_data';
            testData.push({ address: './data folder/' + randomName + '.' + fileType, name: randomName + '.' + fileType });
            amount--;
        }
        return testData;
    },
    
    runnerFactory: runnerFactory = function (options) {
        const runner = require('../newman-async-runner').NewmanRunner;
        return new runner(options);
    },

    cleanTestDirectory: cleanTestDirectory = async function () {
        folders = optionsFactory().folders
        try {
            for (f in folders) {
                if (!fs.existsSync(folders[f])) {
                    continue;
                } else {
                    for (file of fs.readdirSync(folders[f])) {
                        fs.unlinkSync(folders[f] + file);
                    }
                    await fs.rmdirSync(folders[f], { recursive: true });
                }
            }
        } catch (e) { throw e }
    },

    createTestFolders: createTestFolders = async function (options) {
        for (f in options.folders) {
            fs.mkdirSync(options.folders[f], { recursive: true });
        }
    },

    getReportsFrom: getReportsFrom = async function (reportsPath) {
        let reportFiles = new Array()
        let reportsDirectory = await fs.readdirSync(reportsPath).filter(function (e) {
            return path.extname(e).toLowerCase() === '.html';
        });
        for (let file of reportsDirectory) {
            reportFiles.push(file);
        }
        return reportFiles;
    },

    callPostmanApi: callPostmanApi = async function(uri){
        switch (uri){
            case api_collectionsEndpoint: 
                return { "collections": [
                    { "id": "13f4c16b-dcbb-4440-8198-d60f9061eaff", "name": "snippets", "owner": "8804262", "uid": "8804262-13f4c16b-dcbb-4440-8198-d60f9061eaff" },
                    { "id": "b6a908f0-d4a8-4a5e-9ddc-96fed552e863", "name": "test", "owner": "8804262", "uid": "8804262-b6a908f0-d4a8-4a5e-9ddc-96fed552e863" },
                    { "id": "c4129d67-4b56-44d1-a7cc-3c3da87ec73a", "name": "yolo", "owner": "8804262", "uid": "8804262-c4129d67-4b56-44d1-a7cc-3c3da87ec73a" }] };
            case api_yolo:
                return {collection:await JSON.parse(fs.readFileSync('./test/testdata/api/yolo.postman_collection.json'))};
            case api_test:
                return {collection:await JSON.parse(fs.readFileSync('./test/testdata/api/test.postman_collection.json'))};
            case api_snippets:
                return {collection:await JSON.parse(fs.readFileSync('./test/testdata/api/snippets.postman_collection.json'))};
            case api_environmentsEndpoint:
                return { "environments": [
                    { "id": "7b563f42-8bed-4ed7-aba7-7eca1e0d6230", "name": "UAT", "owner": "8804262", "uid": "8804262-7b563f42-8bed-4ed7-aba7-7eca1e0d6230" },
                    { "id": "d98686c9-d6b6-4be1-b0cb-a2adbb3aa4c4", "name": "SIT", "owner": "8804262", "uid": "8804262-d98686c9-d6b6-4be1-b0cb-a2adbb3aa4c4" }] };
            case api_UAT:
                return {environment:await JSON.parse(fs.readFileSync('./test/testdata/api/UAT.postman_environment.json'))};
            case api_SIT:
                return {environment:await JSON.parse(fs.readFileSync('./test/testdata/api/SIT.postman_environment.json'))};
            case 'error':
                throw new Error("request error");
            default:
                throw new Error('unsupported uri: ' + uri);
        }
    },

    callFileApi: callFileApi = async function(url){
        switch (url){
            case local_dataFolder:
                return ['data.json', 'data.csv'];
            case local_collectionsFolder:
                return ['snippets.postman_collection.json', 'test.postman_collection.json', 'yolo.postman_collection.json'];
            case local_environmentsFolder:
                return ['UAT.postman_environment', 'SIT.postman_environment'];
            case local_dataJson:
                return [{"url":"KLAX"},{"url":"KSBP"},{"url":"KSBA"}];
            case local_dataCsv:
                return 'url\nKLAX\nKSBP\nKSBA';
            case local_yolo:
                return await JSON.parse(fs.readFileSync('./test/testdata/api/yolo.postman_collection.json'));
            case local_test:
                return await JSON.parse(fs.readFileSync('./test/testdata/api/test.postman_collection.json'));
            case local_snippets:
                return await JSON.parse(fs.readFileSync('./test/testdata/api/snippets.postman_collection.json'));
            case local_UAT:
                return await JSON.parse(fs.readFileSync('./test/testdata/api/UAT.postman_environment.json'));
            case local_SIT:
                return await JSON.parse(fs.readFileSync('./test/testdata/api/SIT.postman_environment.json'));
            case 'error':
                throw new Error("file system error");
                default:
                    throw new Error('unsupported url: ' + url);             
        }
    }
}
