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

    getApiKey: getApiKey = async function () {
        try{
            return '?apikey=' + await JSON.parse(fs.readFileSync('./test/testdata/postmanApiKey.json')).key;
        } catch {
            throw new Error('unable to open postmanApiKey.json file')
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
    
    runnerFactory: runnerFactory = function () {
        return new require('../newman-async-runner');
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
        const collectionsEndpoint = 'https://api.getpostman.com/collections/?apikey=API_KEY_POSTMAN';
        const environmentsEndpoint = 'https://api.getpostman.com/environments/?apikey=API_KEY_POSTMAN';
        const snippets = 'https://api.getpostman.com/collections/8804262-13f4c16b-dcbb-4440-8198-d60f9061eaff?apikey=API_KEY_POSTMAN';
        const test = 'https://api.getpostman.com/collections/8804262-b6a908f0-d4a8-4a5e-9ddc-96fed552e863?apikey=API_KEY_POSTMAN';
        const yolo = 'https://api.getpostman.com/collections/8804262-c4129d67-4b56-44d1-a7cc-3c3da87ec73a?apikey=API_KEY_POSTMAN';
        const UAT = 'https://api.getpostman.com/environments/8804262-7b563f42-8bed-4ed7-aba7-7eca1e0d6230?apikey=API_KEY_POSTMAN';
        const SIT = 'https://api.getpostman.com/environments/8804262-d98686c9-d6b6-4be1-b0cb-a2adbb3aa4c4?apikey=API_KEY_POSTMAN';
        switch (uri){
            case collectionsEndpoint: 
                return { "collections": [
                    { "id": "13f4c16b-dcbb-4440-8198-d60f9061eaff", "name": "snippets", "owner": "8804262", "uid": "8804262-13f4c16b-dcbb-4440-8198-d60f9061eaff" },
                    { "id": "b6a908f0-d4a8-4a5e-9ddc-96fed552e863", "name": "test", "owner": "8804262", "uid": "8804262-b6a908f0-d4a8-4a5e-9ddc-96fed552e863" },
                    { "id": "c4129d67-4b56-44d1-a7cc-3c3da87ec73a", "name": "yolo", "owner": "8804262", "uid": "8804262-c4129d67-4b56-44d1-a7cc-3c3da87ec73a" }] };
            case yolo:
                return {collection:await JSON.parse(fs.readFileSync('./test/testdata/api/yolo.postman_collection.json'))};
            case test:
                return {collection:await JSON.parse(fs.readFileSync('./test/testdata/api/test.postman_collection.json'))};
            case snippets:
                return {collection:await JSON.parse(fs.readFileSync('./test/testdata/api/snippets.postman_collection.json'))};
            case environmentsEndpoint:
                return { "environments": [
                    { "id": "7b563f42-8bed-4ed7-aba7-7eca1e0d6230", "name": "UAT", "owner": "8804262", "uid": "8804262-7b563f42-8bed-4ed7-aba7-7eca1e0d6230" },
                    { "id": "d98686c9-d6b6-4be1-b0cb-a2adbb3aa4c4", "name": "SIT", "owner": "8804262", "uid": "8804262-d98686c9-d6b6-4be1-b0cb-a2adbb3aa4c4" }] };
            case UAT:
                return {environment:await JSON.parse(fs.readFileSync('./test/testdata/api/UAT.postman_environment.json'))};
            case SIT:
                return {environment:await JSON.parse(fs.readFileSync('./test/testdata/api/SIT.postman_environment.json'))};
            case 'error':
                throw new Error("request error");
            default:
                return uri;
        }
    }
}
