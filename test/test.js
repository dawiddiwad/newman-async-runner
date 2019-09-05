// console.log = function(){
//         return;
//     }

const 
    chai = require('chai'),
    spies = require('chai-spies');
    sinon = require('sinon'),
    should = chai.should(),
    expect = chai.expect;

chai.use(spies);

const 
path = require('path'),
fs = require('fs'),
async = require('async'),
copyTest = {
    collections: async function(amount, options){
        while (amount){
            await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json',
                options.folders.collections + amount + '_col.json');
            amount--;    
        }
    },
    environments: async function(amount, options){
        while (amount){
            await fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json',
                options.folders.environments + amount + '_env.json');
            amount--;    
        }
    },
    data: async function(amount, options){
        while (amount){
            await fs.copyFileSync('./test/testdata/data/data.json',
                options.folders.data + amount + '_data.json');
            amount--;    
        }
    },
    templates: async function(options){
        await fs.copyFileSync('./test/testdata/templates/htmlreqres.hbs',
            options.folders.templates + 'htmlreqres.hbs');  
    },
    all: async function(amount, options){
        this.collections(amount, options);
        this.environments(amount, options);
        this.data(amount, options);
        this.templates(options);
    }
};
optionsFactory = function(){
    return runnerOptions = {
        parallelFolderRuns: false,                                  
        folders: {
            collections:'./test/collections/',                        
            environments: './test/environments/',                       
            reports: './test/reports/',                                 
            data: './test/data/',                                        
            templates: './test/templates/'},                             
        reporter_template: 'htmlreqres.hbs', 
        anonymizeFilter: 'rebelia',                       
        specific_collection_items_to_run: ['folder1', 'LUZEM']    
    };
}
runnerFactory = function(){
    return require('../newman-async-runner');
}
cleanTestDirectory = async function(){
    folders = optionsFactory().folders
    try{
        for (f in folders){
            for (file of await fs.readdirSync(folders[f])){
                await fs.unlinkSync(folders[f] + file);
            }
            await fs.rmdirSync(folders[f]);
        }
    } catch (e){
        throw e;
    }
}
createTestFolders = async function(options){
    for (f in options.folders){
        await fs.mkdirSync(options.folders[f], {recursive: true});
    }
}


// describe('newman-async-runner unit',  function(){
//     let 
//         assert,
//         _nar,
//         runnerOptions;
//     function resetOptions(){
//         runnerOptions = {
//             parallelFolderRuns: false,                                  
//             folders: {
//                 collections:'./test/collections/',                        
//                 environments: './test/environments/',                       
//                 reports: './test/reports/',                                 
//                 data: './test/data/',                                        
//                 templates: './test/templates/'},                             
//             reporter_template: 'htmlreqres.hbs',  
//             anonymizeFilter: 'rebelia',                      
//             specific_collection_items_to_run: ['folder1 Copy', 'LUZEM']    
//         };
//     }    

//     before(function(){
//         this.timeout(10000);
//         assert = require('assert');
//         _nar = require('../newman-async-runner'); 
//          resetOptions();
//     })
//     describe('#setupFolders()',  function(){
//         let directory;
//         before(async function(){
//             await new _nar.NewmanRunner(runnerOptions).setupFolders();
//             directory = await fs.readdirSync('./test/');
//         })
//         after(async function(){
//             for (let folder in runnerOptions.folders){
//                 await fs.rmdirSync(runnerOptions.folders[folder]);
//             }
//         })
//         it('directory should contain folder: collections', function(){
//             assert(directory.includes('collections'), true);
//         })
//         it('directory should contain folder: environments', function(){
//             assert(directory.includes('environments'), true);
//         })
//         it('directory should contain folder: reports', function(){
//             assert(directory.includes('reports'), true);
//         })
//         it('directory should contain folder: data', function(){
//             assert(directory.includes('data'), true);
//         })
//         it('directory should contain folder: templates', function(){
//             assert(directory.includes('templates'), true);
//         })
//     })
//     describe('#getCollections()', function(){
//         let collectionObjects;
//         before(async function(){
//             await fs.mkdirSync(runnerOptions.folders.collections, {recursive: true});
//             await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection.json');
//             await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection2.json');
//             collectionObjects = await new _nar.NewmanRunner(runnerOptions).getCollections();
//         })
//         after(async function(){
//             try{
//                 await fs.unlinkSync('./test/collections/yolo.postman_collection.json')
//                 await fs.unlinkSync('./test/collections/yolo.postman_collection2.json')
//                 await fs.rmdirSync(runnerOptions.folders.collections);
//             } catch{}
//         })
//         it('should generate collections', async function(){    
//             assert.equal(collectionObjects.length, 2);        
//         })
//         it('collection has address', async function(){
//             assert.equal(collectionObjects[0].address, './test/collections/yolo.postman_collection.json');
//             assert.equal(collectionObjects[1].address, './test/collections/yolo.postman_collection2.json');
//         })
//         it('collection has name', async function(){
//             assert.equal(collectionObjects[0].name, 'yolo');
//             assert.equal(collectionObjects[1].name, 'yolo');

//         })
//         it('collections has folders', async function(){
//             assert.equal(collectionObjects[0].folders.length, 3);
//             assert.equal(collectionObjects[1].folders.length, 3);
//         })
//         it('collection has correct folders content', async function(){
//             assert.equal(collectionObjects[0].folders[0],'folder1');
//             assert.equal(collectionObjects[0].folders[1], 'folder1 Copy');
//             assert.equal(collectionObjects[0].folders[2], 'LUZEM');
//             assert.equal(collectionObjects[1].folders[0],'folder1');
//             assert.equal(collectionObjects[1].folders[1], 'folder1 Copy');
//             assert.equal(collectionObjects[1].folders[2], 'LUZEM');
//         })
//     })
//     describe('#getEnvironments()', function(){
//         let environmentObjects;
//         before(async function(){
//             await fs.mkdirSync(runnerOptions.folders.environments, {recursive: true});
//             await fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment.json');
//             await fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment2.json');
//             environmentObjects = await new _nar.NewmanRunner(runnerOptions).getEnvironments();
//         })
//         after(async function(){
//             try{
//                 await fs.unlinkSync('./test/environments/UAT.postman_environment.json')
//                 await fs.unlinkSync('./test/environments/UAT.postman_environment2.json')
//                 await fs.rmdirSync(runnerOptions.folders.environments);
//             } catch(e){console.log(e);}
//         })
//         it('should generate environments', async function(){    
//             assert.equal(environmentObjects.length, 2);        
//         })
//         it('should return undefined array if no environments path is specified', async function(){
//             copyOptions = JSON.parse(JSON.stringify(runnerOptions));
//             delete copyOptions.folders.environments;
//             let returnEnvironments = await new _nar.NewmanRunner(copyOptions).getEnvironments();
//             assert.deepEqual(returnEnvironments, [undefined]);
//         })
//         it('environment has address', async function(){
//             assert.equal(environmentObjects[0].address, './test/environments/UAT.postman_environment.json');
//             assert.equal(environmentObjects[1].address, './test/environments/UAT.postman_environment2.json');
//         })
//         it('environment has name', async function(){
//             assert.equal(environmentObjects[0].name, 'UAT');
//             assert.equal(environmentObjects[1].name, 'UAT');
//         })
//     })
//     describe('#anonymizeReportsPassword()', function(){
//         let reportFiles = new Array();
//         before(async function(){
//             let runnerOptions_copy = runnerOptions;
//             runnerOptions_copy.anonymizeFilter = 'rebelia';

//             await fs.mkdirSync(runnerOptions_copy.folders.reports, {recursive: true});
//             await fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders.html');
//             await fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders2.html');
//             await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
//             let reportsDirFiles = await fs.readdirSync('./test/reports/', 'utf8');
//             for (file of reportsDirFiles){
//                 reportFiles.push(await fs.readFileSync('./test/reports/' + file, 'utf8'));
//             }
//         })
//         after(async function(){
//             try{
//                 let reportsDirFiles = await fs.readdirSync('./test/reports/', 'utf8');
//                 for (file of reportsDirFiles){
//                     await fs.unlinkSync('./test/reports/' + file)
//                 }
//                 await fs.rmdirSync(runnerOptions.folders.reports);
//             } catch{}
//         })
//         it('removes password', function(){
//             for (file of reportFiles){
//                 assert.equal(file.includes('123DuP@321'), false);
//             }
//         })
//         it('puts *** in place of password', function(){
//             for (file of reportFiles){
//                 assert.equal(file.includes('***'), true);
//             }
//         })
//         it('utilizes custom anonymize filter', async function(){
//             let runnerOptions_copy = runnerOptions;
//             runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
//             await fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
//             await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
//             let file = await fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

//             assert.equal(file.includes('lt;n1:password&gt'), false);
//             assert.equal(file.includes('lt;n1:***&gt'), true);
//         })
//         it('does not anonymize report when requeired', async function(){
//             let runnerOptions_copy = runnerOptions;
//             runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
//             delete runnerOptions_copy.anonymizeFilter;
//             await fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
//             await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
//             let file = await fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

//             assert.equal(file.includes('123DuP@321'), true);
//         })
//     })
//     describe('#prepareRunOptions()', function(){
//         let
//             collection = new Object(),
//             environment = new Object(),
//             folder,
//             data,
//             result,
//             runnerOptions_copy,
//             nar;

//         let prepareRunOptionsFor_iterateAllFolders = function(collection, environment, folders, data){
//             nar = new _nar.NewmanRunner(runnerOptions_copy);
//             for (folder of folders){
//                 nar.prepareRunOptions(collection, environment, folder, data);
//             }
//         }    
//         beforeEach(function(){
//             runnerOptions_copy = runnerOptions;

//             collection.address = './test/test - abcd.json';
//             collection.content = 'test content';
//             collection.name = 'test - abcd';
//             collection.folders = ['folder 1', 'folder 2', 'folder 3'];

//             environment.address = './test/test - abcd.json';
//             environment.name = 'test - abcd';

//             data = 'test data.csv';
//         })
//         it('based on spcified folders', async function(){
//             let runner = new _nar.NewmanRunner(runnerOptions);
//             _collectionRuns = chai.spy.on(runner.collectionRuns, 'push');
//             _runNewman = chai.spy.on(_nar.newman, 'run', function (...items){
//                 const _results = [...items][0];
//                 expect(runnerOptions.specific_collection_items_to_run).to.include(_results.folder);
//             });

//             runner.prepareRunOptions(collection, environment, 'LUZEM', data);
//             runner.collectionRuns[0]();
//             _collectionRuns.should.have.been.called(1);

//             runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0]];
//             nar = new _nar.NewmanRunner(runnerOptions_copy);
//             prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
//             assert.equal(nar.collectionRuns.length, 1);

//             runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0], collection.folders[2]];
//             nar = new _nar.NewmanRunner(runnerOptions_copy);
//             prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
//             assert.equal(nar.collectionRuns.length, 2);
//         })
//         it('with parallel folder runs count', function(){
//             runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0], collection.folders[2]];
//             runnerOptions_copy.parallelFolderRuns = true; 
//             prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
//             assert.equal(nar.collectionRuns.length, 2);

//             runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0], collection.folders[2]];
//             runnerOptions_copy.parallelFolderRuns = false; 
//             prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
//             assert.equal(nar.collectionRuns.length, 2);

//             delete runnerOptions_copy.specific_collection_items_to_run;
//             runnerOptions_copy.parallelFolderRuns = true; 
//             prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
//             assert.equal(nar.collectionRuns.length, 3);

//             delete runnerOptions_copy.specific_collection_items_to_run;
//             runnerOptions_copy.parallelFolderRuns = false; 
//             prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
//             assert.equal(nar.collectionRuns.length, 3);

//             delete runnerOptions_copy.specific_collection_items_to_run;
//             runnerOptions_copy.parallelFolderRuns = false; 
//             nar = new _nar.NewmanRunner(runnerOptions_copy);
//             nar.prepareRunOptions(collection, environment, 'all_folders', data);
//             assert.equal(nar.collectionRuns.length, 1);
//         })
//         it('puts correct data for whole collections runs', async function(){
//             runnerOptions_copy = runnerOptions;
//             runnerOptions_copy.folders.data = './data to test/'
//             collection.address = './test/test - abcd.json';
//             collection.content = 'test content';
//             collection.name = 'test - abcd';
//             collection.folders = ['folder 1', 'folder 2', 'folder 3'];
//             environment.address = './test/test - abcd.json';
//             environment.name = 'test - abcd';
//             data = 'test data.csv';

//             _narMock = _nar;
//             _narMock.newman.run = function(options){
//                 assert.equal(options.collection, './test/test - abcd.json');
//                 assert.equal(options.environment, './test/test - abcd.json');
//                 assert.equal(options.folder, undefined);
//                 assert.equal(options.iterationData, './data to test/' + 'test data.csv');
//             }
//             delete runnerOptions_copy.specific_collection_items_to_run;
//             runnerOptions_copy.parallelFolderRuns = false; 
//             nar = new _narMock.NewmanRunner(runnerOptions_copy);
//             nar.prepareRunOptions(collection, environment, 'folder 2', data);
//             await async.parallel(nar.collectionRuns, function (err, results){
// 		    });
//         })
//         it('correctly handles non-environment runs', async function(){
//             runnerOptions_copy = runnerOptions;
//             runnerOptions_copy.folders.data = './data to test/'
//             collection.address = './test/test - abcd.json';
//             collection.content = 'test content';
//             collection.name = 'test - abcd';
//             collection.folders = ['folder 1', 'folder 2', 'folder 3'];
//             data = 'test data.csv';

//             _narMock = _nar;
//             _narMock.newman.run = function(options){
//                 assert.equal(options.collection, './test/test - abcd.json');
//                 assert.equal(options.environment, undefined);
//                 assert.equal(options.folder, undefined);
//                 assert.equal(options.iterationData, './data to test/' + 'test data.csv');
//             }
//             delete runnerOptions_copy.specific_collection_items_to_run;
//             runnerOptions_copy.parallelFolderRuns = false; 
//             nar = new _narMock.NewmanRunner(runnerOptions_copy);
//             nar.prepareRunOptions(collection, undefined, 'folder 2', data);
//             await async.parallel(nar.collectionRuns, function (err, results){
// 		    });
//         })
//         it('puts correct data for folder runs', async function(){
//             runnerOptions_copy = runnerOptions;
//             runnerOptions_copy.folders.data = './data to test/'
//             collection.address = './test/test - abcd.json';
//             collection.content = 'test content';
//             collection.name = 'test - abcd';
//             collection.folders = ['folder 1', 'folder 2', 'folder 3'];
//             environment.address = './test/test - abcd.json';
//             environment.name = 'test - abcd';
//             data = 'test data.csv';

//             _narMock = _nar;
//             _narMock.newman.run = function(options){
//                 assert.equal(options.collection, './test/test - abcd.json');
//                 assert.equal(options.environment, './test/test - abcd.json');
//                 assert.equal(options.folder, 'folder 2');
//                 assert.equal(options.iterationData, './data to test/' + 'test data.csv');
//             }
//             runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
//             runnerOptions_copy.parallelFolderRuns = false; 
//             nar = new _narMock.NewmanRunner(runnerOptions_copy);
//             nar.prepareRunOptions(collection, environment, 'folder 2', data);
//             await async.parallel(nar.collectionRuns, function (err, results){
// 		    });
//         })
//         it('puts correct data for data runs', async function(){
//             runnerOptions_copy = runnerOptions;
//             runnerOptions_copy.folders.data = './data to test/'
//             collection.address = './test/test - abcd.json';
//             collection.content = 'test content';
//             collection.name = 'test - abcd';
//             collection.folders = ['folder 1', 'folder 2', 'folder 3'];
//             environment.address = './test/test - abcd.json';
//             environment.name = 'test - abcd';
//             data = undefined;

//             _narMock = _nar;
//             _narMock.newman.run = function(options){
//                 assert.equal(options.collection, './test/test - abcd.json');
//                 assert.equal(options.environment, './test/test - abcd.json');
//                 assert.equal(options.folder, 'folder 2');
//                 assert.equal(options.iterationData, undefined);
//             }
//             runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
//             runnerOptions_copy.parallelFolderRuns = false; 
//             nar = new _narMock.NewmanRunner(runnerOptions_copy);
//             nar.prepareRunOptions(collection, environment, 'folder 2', data);
//             await async.parallel(nar.collectionRuns, function (err, results){
//             });
            
//             data = 'data file.json';
//             _narMock = _nar;
//             _narMock.newman.run = function(options){
//                 assert.equal(options.collection, './test/test - abcd.json');
//                 assert.equal(options.environment, './test/test - abcd.json');
//                 assert.equal(options.folder, 'folder 2');
//                 assert.equal(options.iterationData, './data to test/data file.json');
//             }
//             runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
//             runnerOptions_copy.parallelFolderRuns = false; 
//             nar = new _narMock.NewmanRunner(runnerOptions_copy);
//             nar.prepareRunOptions(collection, environment, 'folder 2', data);
//             await async.parallel(nar.collectionRuns, function (err, results){
//             });
//         })
//         it('sets proper reporter template', async function(){
//             runnerOptions_copy = runnerOptions;
//             runnerOptions_copy2 = runnerOptions;
//             delete runnerOptions_copy2.reporter_template;

//             _narMock = _nar;
//             _narMock2 = _nar;

//             _narMock.newman.run = function(options){
//                 assert.equal(options.reporter.htmlfull.template, './test/templates/' + 'htmlreqres.hbs');
//             }
//             _narMock2.newman.run = function(options){
//                 assert.equal(options.reporter.htmlfull.template, undefined);
//             }

//             runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
//             runnerOptions_copy.parallelFolderRuns = false; 
//             runnerOptions_copy2.specific_collection_items_to_run = ['folder 2'];
//             runnerOptions_copy2.parallelFolderRuns = false; 

//             nar = new _narMock.NewmanRunner(runnerOptions_copy);
//             nar.prepareRunOptions(collection, environment, 'folder 2', data);
//             await async.parallel(nar.collectionRuns, function (err, results){
//             });
//             nar2 = new _narMock.NewmanRunner(runnerOptions_copy2);
//             nar2.prepareRunOptions(collection, environment, 'folder 2', data);
//             await async.parallel(nar2.collectionRuns, function (err, results){
// 		    });
//         })
//         it('gives proper name to test report', async function(){

//             runnerOptions_copy = runnerOptions;
//             let _narMock2 = _nar
//             let nar2 = new _narMock2.NewmanRunner(runnerOptions_copy);
//             _narMock2.newman.run = function(options){
//                 assert.equal(options.reporter.htmlfull.export, './test/reports/test - abcd-test - abcd-folder 2.html');
//             }
//             nar2.prepareRunOptions(collection, environment, 'folder 2', undefined);
//             await async.parallel(nar2.collectionRuns, function (err, results){
//             });
            
//             runnerOptions_copy = runnerOptions;
//             nar2 = new _narMock2.NewmanRunner(runnerOptions_copy);
//             _narMock2.newman.run = function(options){
//                 assert.equal(options.reporter.htmlfull.export, './test/reports/test - abcd-test - abcd-folder 2-test data.html');
//             }
//             nar2.prepareRunOptions(collection, environment, 'folder 2', 'test data.csv');
//             await async.parallel(nar2.collectionRuns, function (err, results){
// 		    });
//         })
//     })
    
//     })

describe('nenewman-async-runner e2e', function(){
    this.timeout(10000);
    this.sandbox = undefined;
    describe('#non-data driven runs', function(){
        let collectionsAmount = 3;
        beforeEach(async function(){
            try{
                await createTestFolders(optionsFactory());
                await copyTest.collections(collectionsAmount, optionsFactory());
                await copyTest.templates(optionsFactory());
            } catch(e){throw e}
            sandbox = sinon.sandbox.create();
        })
        afterEach(async function(){
            await cleanTestDirectory();
            sandbox.restore();
        })
        it('creates matrix once for all collections', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            delete options.specific_collection_items_to_run;
            let runner = new _mocked.NewmanRunner(options);

            sanbox.spy(_mocked.newman, 'run');
            await runner.runTests();
            expect(sanbox.args.length).to.equal(collectionsAmount);
            for (let i = 0; i < collectionsAmount; i++){
                console.log(sanbox.args[i][0].collection);
                expect(sanbox.args[i][0].collection).to.equal(options.folders.collections + (i+1) +'_col.json');
            }
        })
        it('creates matrix once for all collections & environments', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            delete options.specific_collection_items_to_run;
            let runner = new _mocked.NewmanRunner(options);

            sanbox.spy(_mocked.newman, 'run');
            await runner.runTests();
            for (let i = 0, c = 0, e = 0; i < collectionsAmount*collectionsAmount; i++, e++){
                console.log(sanbox.args[i][0].collection + ' ' + sanbox.args[i][0].environment);
                expect(sanbox.args[i][0].collection).to.equal(options.folders.collections + (c + 1) +'_col.json');
                expect(sanbox.args[i][0].environment).to.equal(options.folders.environments + (e + 1) +'_env.json');
                if ((i+1) % collectionsAmount == 0) { c++; e = -1}
            }
        })
        it('creates matrix once for all selected folders & environments', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            let runner = new _mocked.NewmanRunner(options);

            sanbox.spy(_mocked.newman, 'run');
            await runner.runTests();
            for (let i = 0, c = 0, e = 0, f = 0; i < collectionsAmount*collectionsAmount*options.specific_collection_items_to_run.length; i++, f++){
                console.log(sanbox.args[i][0].collection + ' ' + sanbox.args[i][0].environment + ' ' + sanbox.args[i][0].folder);
                expect(sanbox.args[i][0].collection).to.equal(options.folders.collections + (c + 1) +'_col.json');
                expect(sanbox.args[i][0].environment).to.equal(options.folders.environments + (e + 1) +'_env.json');
                expect(sanbox.args[i][0].folder).to.equal(options.specific_collection_items_to_run[f]);
                if ((i+1) % (collectionsAmount*options.specific_collection_items_to_run.length) == 0) { c++; e = -1}
                if ((i+1) % options.specific_collection_items_to_run.length == 0) { f = -1; e++;}
            }
        })
        it('creates matrix once for parallel folder runs on all collections & environments')
    })
    describe('#data file(s) driven runs', function(){
        let collectionsAmount = 3;
        beforeEach(async function(){
            try{
                await createTestFolders(optionsFactory());
                await copyTest.collections(collectionsAmount, optionsFactory());
                await copyTest.templates(optionsFactory());
            } catch(e){throw e}
            sanbox = new sinon.createSandbox();
        })
        afterEach(async function(){
            await cleanTestDirectory();
            sandbox.restore();
        })
        it('creates matrix once for all collections')
        it('creates matrix once for all collections & environments')
        it('creates matrix once for all collectons & environments & data files', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            await copyTest.data(collectionsAmount, options);
            delete options.specific_collection_items_to_run;
            let runner = new _mocked.NewmanRunner(options);

            sanbox.spy(_mocked.newman, 'run');
            await runner.runTests();
            for (let i = 0, c = 0, e = 0, d = 0; i < collectionsAmount*collectionsAmount*collectionsAmount; i++, e++){
                console.log(sanbox.args[i][0].collection + ' ' + sanbox.args[i][0].environment + ' ' + sanbox.args[i][0].iterationData);
                expect(sanbox.args[i][0].collection).to.equal(options.folders.collections + (c + 1) +'_col.json');
                expect(sanbox.args[i][0].environment).to.equal(options.folders.environments + (e + 1) +'_env.json');
                expect(sanbox.args[i][0].iterationData).to.equal(options.folders.data + (d + 1) +'_data.json');
                if ((i+1) % (collectionsAmount*collectionsAmount) == 0) { c = 0; e = -1; d++; continue;}
                if ((i+1) % collectionsAmount == 0) { c++; e = -1}
            } 
        })
        it('creates data run once for single data file')
        it('creates data runs for all data files')
    })
})    