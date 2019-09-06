console.log = function(){
        return;
    }

const 
    chai = require('chai'),
    sinon = require('sinon'),
    expect = chai.expect;


const 
fs = require('fs'),
async = require('async'),
copyTest = {
    collections: async function(amount, options){
        while (amount){
            fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', options.folders.collections + amount + '_col.json');
            amount--;    
        }
    },
    environments: async function(amount, options){
        while (amount){
            fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', options.folders.environments + amount + '_env.json');
            amount--;    
        }
    },
    data: async function(amount, options){
        while (amount){
            fs.copyFileSync('./test/testdata/data/data.json', options.folders.data + amount + '_data.json');
            amount--;    
        }
    },
    templates: async function(options){
        fs.copyFileSync('./test/testdata/templates/htmlreqres.hbs', options.folders.templates + 'htmlreqres.hbs');  
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

collectionFactory = function(amount){
    let array = new Array();
    for (let i = 0; i < amount; i++){
        let randomName = Math.floor((Math.random() * 9999) + 1) + 'col';
        array.push({address: './folder/' + randomName + '.json', content: 'test content', name: randomName, folders:
        ['f1', 'f2', 'f3']});
    }
    return array;
}

environmentFactory = function(amount){
    let array = new Array();
    for (let i = 0; i < amount; i++){
        let randomName = Math.floor((Math.random() * 9999) + 1) + 'env';
        array.push({address: './folder/' + randomName + '.json', name: randomName});
    }
    return array;
}

runnerFactory = function(){
    return new require('../newman-async-runner');
}
cleanTestDirectory = async function(){
    folders = optionsFactory().folders
    try{
        for (f in folders){
            for (file of fs.readdirSync(folders[f])){
                fs.unlinkSync(folders[f] + file);
            }
            await fs.rmdirSync(folders[f], {recursive: true});
        }
    } catch (e){ throw e }
}
createTestFolders = async function(options){
    for (f in options.folders){
        fs.mkdirSync(options.folders[f], { recursive: true });
    }
}


describe('newman-async-runner [unit]', async function(done){
    let 
        assert,
        _nar,
        sandbox,
        runnerOptions;
    function resetOptions(){
        runnerOptions = {
            parallelFolderRuns: false,                                  
            folders: {
                collections:'./test/collections/',                        
                environments: './test/environments/',                       
                reports: './test/reports/',                                 
                data: './test/data/',                                        
                templates: './test/templates/'},                             
            reporter_template: 'htmlreqres.hbs',  
            anonymizeFilter: 'rebelia',                      
            specific_collection_items_to_run: ['folder1 Copy', 'LUZEM']    
        };
    }    

    before(function(){
        this.timeout(10000);
        assert = require('assert');
        _nar = runnerFactory(); 
         resetOptions();
    })
    describe('#setupFolders()',  function(){
        let directory;
        before(async function(){
            await new _nar.NewmanRunner(runnerOptions).setupFolders();
            directory = fs.readdirSync('./test/');
        })
        after(async function(){
            await cleanTestDirectory();
        })
        it('directory should contain folder: collections', function(){
            assert(directory.includes('collections'), true);
        })
        it('directory should contain folder: environments', function(){
            assert(directory.includes('environments'), true);
        })
        it('directory should contain folder: reports', function(){
            assert(directory.includes('reports'), true);
        })
        it('directory should contain folder: data', function(){
            assert(directory.includes('data'), true);
        })
        it('directory should contain folder: templates', function(){
            assert(directory.includes('templates'), true);
        })
    })
    describe('#getCollections()', function(){
        let collectionObjects;
        before(async function(){
            await createTestFolders(optionsFactory());
            fs.mkdirSync(runnerOptions.folders.collections, { recursive: true });
            fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection.json');
            fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection2.json');
            collectionObjects = await new _nar.NewmanRunner(runnerOptions).getCollections();
        })
        after(async function(){
            await cleanTestDirectory();
        })
        it('should generate collections', async function(){    
            assert.equal(collectionObjects.length, 2);        
        })
        it('collection has address', async function(){
            assert.equal(collectionObjects[0].address, './test/collections/yolo.postman_collection.json');
            assert.equal(collectionObjects[1].address, './test/collections/yolo.postman_collection2.json');
        })
        it('collection has name', async function(){
            assert.equal(collectionObjects[0].name, 'yolo');
            assert.equal(collectionObjects[1].name, 'yolo');

        })
        it('collections has folders', async function(){
            assert.equal(collectionObjects[0].folders.length, 3);
            assert.equal(collectionObjects[1].folders.length, 3);
        })
        it('collection has correct folders content', async function(){
            assert.equal(collectionObjects[0].folders[0],'folder1');
            assert.equal(collectionObjects[0].folders[1], 'folder1 Copy');
            assert.equal(collectionObjects[0].folders[2], 'LUZEM');
            assert.equal(collectionObjects[1].folders[0],'folder1');
            assert.equal(collectionObjects[1].folders[1], 'folder1 Copy');
            assert.equal(collectionObjects[1].folders[2], 'LUZEM');
        })
    })
    describe('#getEnvironments()', function(){
        let environmentObjects;
        before(async function(){
            await createTestFolders(optionsFactory());
            fs.mkdirSync(runnerOptions.folders.environments, { recursive: true });
            fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment.json');
            fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment2.json');
            environmentObjects = await new _nar.NewmanRunner(runnerOptions).getEnvironments();
        })
        after(async function(){
            await cleanTestDirectory();
        })
        it('should generate environments', function(){    
            assert.equal(environmentObjects.length, 2);        
        })
        it('should return undefined array if no environments path is specified', async function(){
            copyOptions = JSON.parse(JSON.stringify(runnerOptions));
            delete copyOptions.folders.environments;
            let returnEnvironments = await new _nar.NewmanRunner(copyOptions).getEnvironments();
            assert.deepEqual(returnEnvironments, [undefined]);
        })
        it('environment has address', function(){
            assert.equal(environmentObjects[0].address, './test/environments/UAT.postman_environment.json');
            assert.equal(environmentObjects[1].address, './test/environments/UAT.postman_environment2.json');
        })
        it('environment has name', function(){
            assert.equal(environmentObjects[0].name, 'UAT');
            assert.equal(environmentObjects[1].name, 'UAT');
        })
    })
    describe('#anonymizeReportsPassword()', function(){
        let reportFiles = new Array();
        before(async function(){
            await createTestFolders(optionsFactory());
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = 'rebelia';

            fs.mkdirSync(runnerOptions_copy.folders.reports, { recursive: true });
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders.html');
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders2.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let reportsDirFiles = fs.readdirSync('./test/reports/', 'utf8');
            for (file of reportsDirFiles){
                reportFiles.push(fs.readFileSync('./test/reports/' + file, 'utf8'));
            }
        })
        after(async function(){
            await cleanTestDirectory();
        })
        it('removes password', function(){
            for (file of reportFiles){
                assert.equal(file.includes('123DuP@321'), false);
            }
        })
        it('puts *** in place of password', function(){
            for (file of reportFiles){
                assert.equal(file.includes('***'), true);
            }
        })
        it('utilizes custom anonymize filter', async function(){
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let file = fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

            assert.equal(file.includes('lt;n1:password&gt'), false);
            assert.equal(file.includes('lt;n1:***&gt'), true);
        })
        it('does not anonymize report when requeired', async function(){
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
            delete runnerOptions_copy.anonymizeFilter;
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let file = fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

            assert.equal(file.includes('123DuP@321'), true);
        })
    })
    describe('#prepareRunOptions()', function(){
        let
            collection = new Object(),
            environment = new Object(),
            folder,
            data,
            result,
            runnerOptions_copy,
            nar;

        let prepareRunOptionsFor_iterateAllFolders = function(collection, environment, folders, data){
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            for (folder of folders){
                nar.prepareRunOptions(collection, environment, folder, data);
            }
        }    
        beforeEach(async function(){
            sandbox = sinon.createSandbox();
            await createTestFolders(optionsFactory());
            runnerOptions_copy = runnerOptions;

            collection.address = './test/test - abcd.json';
            collection.content = 'test content';
            collection.name = 'test - abcd';
            collection.folders = ['folder 1', 'folder 2', 'folder 3'];

            environment.address = './test/test - abcd.json';
            environment.name = 'test - abcd';

            data = 'test data.csv';

        })
        afterEach(async function(){
            sandbox.restore();
            await cleanTestDirectory();
        })
        it('based on spcified folders', function(){
            runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0]];
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
            assert.equal(nar.collectionRuns.length, 1);

            runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0], collection.folders[2]];
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
            assert.equal(nar.collectionRuns.length, 2);
        })
        it('with parallel folder runs count', function(){
            runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0], collection.folders[2]];
            runnerOptions_copy.parallelFolderRuns = true; 
            prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
            assert.equal(nar.collectionRuns.length, 2);

            runnerOptions_copy.specific_collection_items_to_run = [collection.folders[0], collection.folders[2]];
            runnerOptions_copy.parallelFolderRuns = false; 
            prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
            assert.equal(nar.collectionRuns.length, 2);

            delete runnerOptions_copy.specific_collection_items_to_run;
            runnerOptions_copy.parallelFolderRuns = true; 
            prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
            assert.equal(nar.collectionRuns.length, 3);

            delete runnerOptions_copy.specific_collection_items_to_run;
            runnerOptions_copy.parallelFolderRuns = false; 
            prepareRunOptionsFor_iterateAllFolders(collection, environment, collection.folders, data);
            assert.equal(nar.collectionRuns.length, 3);

            delete runnerOptions_copy.specific_collection_items_to_run;
            runnerOptions_copy.parallelFolderRuns = false; 
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            nar.prepareRunOptions(collection, environment, 'all_folders', data);
            assert.equal(nar.collectionRuns.length, 1);
        })
        it('puts correct data for whole collections runs', async function(){
            let options = optionsFactory();
            delete options.specific_collection_items_to_run;

            let NAR = runnerFactory();
            NAR = new NAR.NewmanRunner(options);

            let collectionRunsSpy = sandbox.spy(NAR.collectionRuns, 'push');
            let runsSpy = sandbox.spy(runnerFactory().newman, 'run');

            let collections = collectionFactory(1);
            let environments = environmentFactory(1);
            await NAR.prepareRunOptions(collections[0], environments[0], collections[0].folders[0], 'data.csv');
            sinon.assert.calledOnce(collectionRunsSpy);

            await async.parallel(NAR.collectionRuns, function(){});
            expect(runsSpy.args[0][0].collection).to.equal(collections[0].address);
            expect(runsSpy.args[0][0].environment).to.equal(environments[0].address);
            expect(runsSpy.args[0][0].iterationData).to.equal(options.folders.data + 'data.csv');
        })
        // it('correctly handles non-environment runs', async function(){
        //     runnerOptions_copy = runnerOptions;
        //     runnerOptions_copy.folders.data = './data to test/'
        //     collection.address = './test/test - abcd.json';
        //     collection.content = 'test content';
        //     collection.name = 'test - abcd';
        //     collection.folders = ['folder 1', 'folder 2', 'folder 3'];
        //     data = 'test data.csv';

        //     _narMock = _nar;
        //     _narMock.newman.run = function(options){
        //         assert.equal(options.collection, './test/test - abcd.json');
        //         assert.equal(options.environment, undefined);
        //         assert.equal(options.folder, undefined);
        //         assert.equal(options.iterationData, './data to test/' + 'test data.csv');
        //     }
        //     delete runnerOptions_copy.specific_collection_items_to_run;
        //     runnerOptions_copy.parallelFolderRuns = false; 
        //     nar = new _narMock.NewmanRunner(runnerOptions_copy);
        //     nar.prepareRunOptions(collection, undefined, 'folder 2', data);
        //     await async.parallel(nar.collectionRuns, function (err, results) {
        //     });
        // })
        // it('puts correct data for folder runs', async function(){
        //     runnerOptions_copy = runnerOptions;
        //     runnerOptions_copy.folders.data = './data to test/'
        //     collection.address = './test/test - abcd.json';
        //     collection.content = 'test content';
        //     collection.name = 'test - abcd';
        //     collection.folders = ['folder 1', 'folder 2', 'folder 3'];
        //     environment.address = './test/test - abcd.json';
        //     environment.name = 'test - abcd';
        //     data = 'test data.csv';

        //     _narMock = _nar;
        //     _narMock.newman.run = function(options){
        //         assert.equal(options.collection, './test/test - abcd.json');
        //         assert.equal(options.environment, './test/test - abcd.json');
        //         assert.equal(options.folder, 'folder 2');
        //         assert.equal(options.iterationData, './data to test/' + 'test data.csv');
        //     }
        //     runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
        //     runnerOptions_copy.parallelFolderRuns = false; 
        //     nar = new _narMock.NewmanRunner(runnerOptions_copy);
        //     nar.prepareRunOptions(collection, environment, 'folder 2', data);
        //     await async.parallel(nar.collectionRuns, function (err, results) {
        //     });
        // })
        // it('puts correct data for data runs', async function(){
        //     runnerOptions_copy = runnerOptions;
        //     runnerOptions_copy.folders.data = './data to test/'
        //     collection.address = './test/test - abcd.json';
        //     collection.content = 'test content';
        //     collection.name = 'test - abcd';
        //     collection.folders = ['folder 1', 'folder 2', 'folder 3'];
        //     environment.address = './test/test - abcd.json';
        //     environment.name = 'test - abcd';
        //     data = undefined;

        //     _narMock = _nar;
        //     _narMock.newman.run = function(options){
        //         assert.equal(options.collection, './test/test - abcd.json');
        //         assert.equal(options.environment, './test/test - abcd.json');
        //         assert.equal(options.folder, 'folder 2');
        //         assert.equal(options.iterationData, undefined);
        //     }
        //     runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
        //     runnerOptions_copy.parallelFolderRuns = false; 
        //     nar = new _narMock.NewmanRunner(runnerOptions_copy);
        //     nar.prepareRunOptions(collection, environment, 'folder 2', data);
        //     async.parallel(nar.collectionRuns, function (err, results) {
        //     });
            
        //     data = 'data file.json';
        //     _narMock = _nar;
        //     _narMock.newman.run = function(options){
        //         assert.equal(options.collection, './test/test - abcd.json');
        //         assert.equal(options.environment, './test/test - abcd.json');
        //         assert.equal(options.folder, 'folder 2');
        //         assert.equal(options.iterationData, './data to test/data file.json');
        //     }
        //     runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
        //     runnerOptions_copy.parallelFolderRuns = false; 
        //     nar = new _narMock.NewmanRunner(runnerOptions_copy);
        //     nar.prepareRunOptions(collection, environment, 'folder 2', data);
        //     await async.parallel(nar.collectionRuns, function (err, results) {
        //     });
        // })
        // it('sets proper reporter template', async function(){
        //     runnerOptions_copy = runnerOptions;
        //     runnerOptions_copy2 = runnerOptions;
        //     delete runnerOptions_copy2.reporter_template;

        //     _narMock = _nar;
        //     _narMock2 = _nar;

        //     _narMock.newman.run = function(options){
        //         assert.equal(options.reporter.htmlfull.template, './test/templates/' + 'htmlreqres.hbs');
        //     }
        //     _narMock2.newman.run = function(options){
        //         assert.equal(options.reporter.htmlfull.template, undefined);
        //     }

        //     runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
        //     runnerOptions_copy.parallelFolderRuns = false; 
        //     runnerOptions_copy2.specific_collection_items_to_run = ['folder 2'];
        //     runnerOptions_copy2.parallelFolderRuns = false; 

        //     nar = new _narMock.NewmanRunner(runnerOptions_copy);
        //     nar.prepareRunOptions(collection, environment, 'folder 2', data);
        //     async.parallel(nar.collectionRuns, function (err, results) {
        //     });
        //     nar2 = new _narMock.NewmanRunner(runnerOptions_copy2);
        //     nar2.prepareRunOptions(collection, environment, 'folder 2', data);
        //     async.parallel(nar2.collectionRuns, function (err, results) {
        //     });
        // })
        // it('gives proper name to test report', async function(){

        //     runnerOptions_copy = runnerOptions;
        //     let _narMock2 = _nar
        //     let nar2 = new _narMock2.NewmanRunner(runnerOptions_copy);
        //     _narMock2.newman.run = function(options){
        //         assert.equal(options.reporter.htmlfull.export, './test/reports/test - abcd-test - abcd-folder 2.html');
        //     }
        //     nar2.prepareRunOptions(collection, environment, 'folder 2', undefined);
        //     async.parallel(nar2.collectionRuns, function (err, results) {
        //     });
            
        //     runnerOptions_copy = runnerOptions;
        //     nar2 = new _narMock2.NewmanRunner(runnerOptions_copy);
        //     _narMock2.newman.run = function(options){
        //         assert.equal(options.reporter.htmlfull.export, './test/reports/test - abcd-test - abcd-folder 2-test data.html');
        //     }
        //     nar2.prepareRunOptions(collection, environment, 'folder 2', 'test data.csv');
        //     async.parallel(nar2.collectionRuns, function (err, results) {
        //     });
        // })
    })
    })

describe('newman-async-runner [e2e]', async function(){
    this.timeout(10000);
    let sandbox;
    describe('#non-data driven runs', function(){
        let collectionsAmount = 3;
        beforeEach(async function(){
            try{
                await createTestFolders(optionsFactory());
                await copyTest.collections(collectionsAmount, optionsFactory());
                await copyTest.templates(optionsFactory());
            } catch(e){//throw e
            }
            sandbox = sinon.createSandbox();
        })
        afterEach(async function(){
            await cleanTestDirectory();
            sandbox.restore();
        })
        it('runs for all collections', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            delete options.specific_collection_items_to_run;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            await runner.runTests();
            expect(_runs.args.length).to.equal(collectionsAmount);
            for (let i = 0; i < collectionsAmount; i++){
                //console.log(_runs.args[i][0].collection);
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (i+1) +'_col.json');
            }
        })
        it('runs for all collections & environments', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            delete options.specific_collection_items_to_run;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            await runner.runTests();
            for (let i = 0, c = 0, e = 0; i < collectionsAmount*collectionsAmount; i++, e++){
                //console.log(_runs.args[i][0].collection + ' ' + _runs.args[i][0].environment);
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (c + 1) +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + (e + 1) +'_env.json');
                if ((i+1) % collectionsAmount == 0) { c++; e = -1}
            }
        })
        it('runs for selected folders on all collections & environments', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            await runner.runTests();
            for (let i = 0, c = 0, e = 0, f = 0; i < collectionsAmount*collectionsAmount*options.specific_collection_items_to_run.length; i++, f++){
                //console.log(_runs.args[i][0].collection + ' ' + _runs.args[i][0].environment + ' ' + _runs.args[i][0].folder);
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (c + 1) +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + (e + 1) +'_env.json');
                expect(_runs.args[i][0].folder).to.equal(options.specific_collection_items_to_run[f]);
                if ((i+1) % (collectionsAmount*options.specific_collection_items_to_run.length) == 0) { c++; e = -1}
                if ((i+1) % options.specific_collection_items_to_run.length == 0) { f = -1; e++;}
            }
        })
        it('parallel folder runs on all collections & environments', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            delete options.specific_collection_items_to_run;
            options.parallelFolderRuns = true;
            let runner = new _mocked.NewmanRunner(options);

            let testFolders = ['folder1', 'folder1 Copy', 'LUZEM'];

            let _runs = sandbox.spy(_mocked.newman, 'run');
            await runner.runTests();

            for (let i = 0, c = 1, e = 1, f = 1; i < collectionsAmount*collectionsAmount*3; i++){
                //console.log(_runs.args[i][0].folder + ' ' + _runs.args[i][0].collection + ' ' + _runs.args[i][0].environment);
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + c +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + e +'_env.json');
                expect(_runs.args[i][0].folder).to.equal(testFolders[(f-1)]);
                //console.log(f + ' ' + c + ' ' + e ); 
                if ((i+1) % 3 == 0) { f = 0; } f++;
                if ((i+1) % (collectionsAmount*collectionsAmount) == 0) { c++, e = 0 }
                if ((i+1) % collectionsAmount == 0) { e++; }
            }
        })
    })
    describe('#data file(s) driven runs', function(){
        let collectionsAmount = 3;
        beforeEach(async function(){
            try{
                await createTestFolders(optionsFactory());
                await copyTest.collections(collectionsAmount, optionsFactory());
                await copyTest.templates(optionsFactory());
            } catch(e){throw e}
            sandbox = sinon.createSandbox();
        })
        afterEach(async function(){
            await cleanTestDirectory();
            sandbox.restore();
        })
        it('runs for collections & data files', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.data(collectionsAmount, options);
            delete options.specific_collection_items_to_run;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            await runner.runTests();
            for (let i = 0, c = 1, d = 1; i < collectionsAmount*collectionsAmount; i++, c++){
                //console.log(_runs.args[i][0].collection + ' ' + _runs.args[i][0].iterationData);
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (c) +'_col.json');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + (d) +'_data.json');
                //console.log(c + ' ' + d);
                if ((i+1) % (collectionsAmount) == 0) { c = 0; d++}

            } 

        })
        it('rund for all collectons & environments & data files', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            await copyTest.data(collectionsAmount, options);
            delete options.specific_collection_items_to_run;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            await runner.runTests();
            for (let i = 0, c = 0, e = 0, d = 0; i < collectionsAmount*collectionsAmount*collectionsAmount; i++, e++){
                console.log(_runs.args[i][0].collection + ' ' + _runs.args[i][0].environment + ' ' + _runs.args[i][0].iterationData);
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (c + 1) +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + (e + 1) +'_env.json');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + (d + 1) +'_data.json');
                if ((i+1) % (collectionsAmount*collectionsAmount) == 0) { c = 0; e = -1; d++; continue;}
                if ((i+1) % collectionsAmount == 0) { c++; e = -1}
            } 
        })
        it('parallel folder runs on all collections & environments & data files', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            await copyTest.data(collectionsAmount, options);
            delete options.specific_collection_items_to_run;
            options.parallelFolderRuns = true;
            let runner = new _mocked.NewmanRunner(options);

            let testFolders = ['folder1', 'folder1 Copy', 'LUZEM'];

            let _runs = sandbox.spy(_mocked.newman, 'run');
            await runner.runTests();

            for (let i = 0, c = 1, e = 1, f = 1, d = 1; i < collectionsAmount*collectionsAmount*3*3; i++){
                //console.log(_runs.args[i][0].folder + ' ' + _runs.args[i][0].collection + ' ' + _runs.args[i][0].environment + ' ' + _runs.args[i][0].iterationData);
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + c +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + e +'_env.json');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + d +'_data.json');
                expect(_runs.args[i][0].folder).to.equal(testFolders[(f-1)]);
                //console.log(f + ' ' + c + ' ' + e + ' ' + d); 
                if ((i+1) % 3 == 0) { f = 0; } f++;
                if ((i+1) % (collectionsAmount*collectionsAmount*3) == 0 ) {c = 0; d++}
                if ((i+1) % (collectionsAmount*collectionsAmount) == 0) { c++, e = 0 }
                if ((i+1) % collectionsAmount == 0) { e++; }
            }           
        })
    })
})    