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
    let testData = new Array();
    while (amount){
        let randomName = Math.floor((Math.random() * 9999) + 1) + '_col';
        testData.push({address: './collections folder/' + randomName + '.json', content: 'test content', name: randomName, folders:
        ['f1', 'f2', 'f3']});
        amount--;
    }
    return testData;
}

environmentFactory = function(amount){
    let testData = new Array();
    while (amount){
        let randomName = Math.floor((Math.random() * 9999) + 1) + '_env';
        testData.push({address: './environments folder/' + randomName + '.json', name: randomName});
        amount--;
    }
    return testData;
}

dataFactory = function(amount, fileType){
    let testData = new Array();
    while (amount){
        let randomName = Math.floor((Math.random() * 9999) + 1) + '_data';
        testData.push({address: './data folder/' + randomName + '.' + fileType, name: randomName + '.' + fileType});
        amount--;
    }
    return testData;
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
getReportsFrom = async function(reportsPath){
    let reportFiles = new Array()
    let reportsDirectory = await fs.readdirSync(reportsPath).filter(function (e) {
        return path.extname(e).toLowerCase() === '.html';
    });
    for (let file of reportsDirectory){
        reportFiles.push(file);
    }
    return reportFiles;
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
            await createTestFolders(optionsFactory());
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
        it('throws error when no collections folder is set in runner options', async function(){
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
            let options = new Object();
            let _mocked = runnerFactory();
            let runner = new _mocked.NewmanRunner(options);
            try{
                await runner.setupFolders();
            } catch(error){
                expect(error).to.be.a('Error');
                expect(error.message).to.equal('undefined collections path in {runnerOptions.folders} -> Please define at least that :)');
            }
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
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
        it('should return undefined array when there are no collection folders', async function(){
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner({});
            expect(await runner.getCollections()[0]).to.be.undefined;

            runner = new runnerFactory();
            runner = new runner.NewmanRunner({options: null});
            expect(await runner.getCollections()[0]).to.be.undefined;

            runner = new runnerFactory();
            runner = new runner.NewmanRunner({options: {folders: {}}});
            expect(await runner.getCollections()[0]).to.be.undefined;
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
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
        })
        it('removes password', function(){
            for (file of reportFiles){
                expect(file).to.not.include('123DuP@321');
            }
        })
        it('puts *** in place of password', function(){
            for (file of reportFiles){
                expect(file).to.include('***');
            }
        })
        it('utilizes custom anonymize filter', async function(){
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let file = fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

            expect(file).to.not.include('lt;n1:password&gt');
            expect(file).to.include('lt;n1:***&gt');
        })
        it('does not anonymize report when requeired', async function(){
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
            delete runnerOptions_copy.anonymizeFilter;
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let file = fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

            expect(file).to.include('123DuP@321');
        })
        it('throws error when unable to access reports folder', async function(){
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner({options: 
                {folders: {reports: './dummy'}},
                anonymizeFilter: 'regex'
            });

            try{
                await runner.anonymizeReportsPassword();
            }catch(error) {
                expect(error).to.be.a('Error');
                expect(error.message).to.equal("could not open reports folder, reports were not anonymized, error occured: TypeError: Cannot read property 'reports' of undefined");
            }
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
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
            runnerOptions_copy.specific_collection_items_to_run = [collectionFactory(1)[0].folders[0]];
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'csv')[0]);
            expect(nar.collectionRuns.length).to.equal(runnerOptions_copy.specific_collection_items_to_run.length)

            runnerOptions_copy.specific_collection_items_to_run = [collectionFactory(1)[0].folders[0], collectionFactory(1)[0].folders[2]];
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'json')[0]);
            expect(nar.collectionRuns.length).to.equal(runnerOptions_copy.specific_collection_items_to_run.length)
        })
        it('with parallel folder runs count', function(){
            runnerOptions_copy.specific_collection_items_to_run = [collectionFactory(1)[0].folders[0], collectionFactory(1)[0].folders[2]];
            runnerOptions_copy.parallelFolderRuns = true; 
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'csv')[0]);
            expect(nar.collectionRuns.length).to.equal(runnerOptions_copy.specific_collection_items_to_run.length)

            runnerOptions_copy.specific_collection_items_to_run = [collectionFactory(1)[0].folders[0], collectionFactory(1)[0].folders[2]];
            runnerOptions_copy.parallelFolderRuns = false; 
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'csv')[0]);
            expect(nar.collectionRuns.length).to.equal(runnerOptions_copy.specific_collection_items_to_run.length)

            delete runnerOptions_copy.specific_collection_items_to_run;
            runnerOptions_copy.parallelFolderRuns = true; 
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'json')[0]);
            expect(nar.collectionRuns.length).to.equal(collectionFactory(1)[0].folders.length)

            delete runnerOptions_copy.specific_collection_items_to_run;
            runnerOptions_copy.parallelFolderRuns = false; 
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'json')[0]);
            expect(nar.collectionRuns.length).to.equal(collectionFactory(1)[0].folders.length)

            delete runnerOptions_copy.specific_collection_items_to_run;
            runnerOptions_copy.parallelFolderRuns = false; 
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            let numberOfCollections = 5;
            for (let i = 0; i < numberOfCollections; i++){
                nar.prepareRunOptions(collectionFactory(1)[0], environmentFactory(1)[0], 'all_folders', dataFactory(1, 'json')[0]);
            }
            expect(nar.collectionRuns.length).to.equal(numberOfCollections);
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
            let dataFiles = dataFactory(1, 'csv');
            await NAR.prepareRunOptions(collections[0], environments[0], collections[0].folders[0], dataFiles[0]);
            sinon.assert.calledOnce(collectionRunsSpy);

            await async.parallel(NAR.collectionRuns, function(){});
            expect(runsSpy.args[0][0].collection).to.equal(collections[0].address);
            expect(runsSpy.args[0][0].environment).to.equal(environments[0].address);
            expect(runsSpy.args[0][0].iterationData).to.equal(dataFiles[0].address);
        })
        it('correctly handles non-environment runs', async function(){
            let options = optionsFactory();
            delete options.specific_collection_items_to_run;

            let NAR = runnerFactory();
            NAR = new NAR.NewmanRunner(options);

            let collectionRunsSpy = sandbox.spy(NAR.collectionRuns, 'push');
            let runsSpy = sandbox.spy(runnerFactory().newman, 'run');

            let collections = collectionFactory(1);
            let dataFiles = dataFactory(1, 'json');
            await NAR.prepareRunOptions(collections[0], undefined, collections[0].folders[0], dataFiles[0]);
            sinon.assert.calledOnce(collectionRunsSpy);

            await async.parallel(NAR.collectionRuns, function(){});
            expect(runsSpy.args[0][0].collection).to.equal(collections[0].address);
            expect(runsSpy.args[0][0].environment).to.equal(undefined);
            expect(runsSpy.args[0][0].iterationData).to.equal(dataFiles[0].address);
        })
        it('puts correct data for folder runs', async function(){
            let options = optionsFactory();
            let collection = collectionFactory(1);
            options.specific_collection_items_to_run = [collection[0].folders[0], collection[0].folders[2]];

            let NAR = runnerFactory();
            NAR = new NAR.NewmanRunner(options);

            let collectionRunsSpy = sandbox.spy(NAR.collectionRuns, 'push');
            let runsSpy = sandbox.spy(runnerFactory().newman, 'run');

            for (let folder of collection[0].folders){
                await NAR.prepareRunOptions(collection[0], undefined, folder, undefined);
            }
            await async.parallel(NAR.collectionRuns, function(){});

            sinon.assert.calledTwice(collectionRunsSpy);
            expect(runsSpy.args[0][0].folder).to.equal(options.specific_collection_items_to_run[0]);
            expect(runsSpy.args[1][0].folder).to.equal(options.specific_collection_items_to_run[1]);
        })
        it('passes-trough external newmanOptions', async function(){
            let options = optionsFactory();
            options.newmanOptions = {
                color: 'off',
                timeoutRequest: 10000,
                collection: 'dummy',
                environment: 'dummy'
            };
            let collection = collectionFactory(1);
            delete options.specific_collection_items_to_run;

            let NAR = runnerFactory();
            NAR = new NAR.NewmanRunner(options);

            let collectionRunsSpy = sandbox.spy(NAR.collectionRuns, 'push');
            let runsSpy = sandbox.spy(runnerFactory().newman, 'run');

            for (let folder of collection[0].folders){
                await NAR.prepareRunOptions(collection[0], undefined, folder, undefined);
            }
            await async.parallel(NAR.collectionRuns, function(){});
            sinon.assert.calledThrice(collectionRunsSpy);
            expect(runsSpy.args[0][0].color).to.equal(options.newmanOptions.color);
            expect(runsSpy.args[1][0].color).to.equal(options.newmanOptions.color);
            expect(runsSpy.args[2][0].color).to.equal(options.newmanOptions.color);
            expect(runsSpy.args[0][0].timeoutRequest).to.equal(10000);
            expect(runsSpy.args[1][0].timeoutRequest).to.equal(10000);
            expect(runsSpy.args[2][0].timeoutRequest).to.equal(10000);
            expect(runsSpy.args[0][0].collection).to.equal(options.newmanOptions.collection);
            expect(runsSpy.args[1][0].collection).to.equal(options.newmanOptions.collection);
            expect(runsSpy.args[2][0].collection).to.equal(options.newmanOptions.collection);
            expect(runsSpy.args[0][0].environment).to.equal(options.newmanOptions.environment);
            expect(runsSpy.args[1][0].environment).to.equal(options.newmanOptions.environment);
            expect(runsSpy.args[2][0].environment).to.equal(options.newmanOptions.environment);
        })
        it('throws error when no collections are defined for newman run', async function(){
            let runner = runnerFactory();
            runner = new runner.NewmanRunner(optionsFactory());
            try{
                runner.prepareRunOptions();  
            }catch(error){
                expect(error).to.be.a('Error');
                expect(error.message).to.include('undefined collection for newman run options')
            }
        })
        it('puts correct data for data runs')
        it('sets proper reporter template')
        it('gives proper name to test report')
    })
})

describe('newman-async-runner [e2e]', async function(){
    this.timeout(120000);
    let sandbox;
    describe('#non-data driven runs', function(){
        let collectionsAmount = 3;
        beforeEach('e2e test', async function(){
            await createTestFolders(optionsFactory());
            await copyTest.collections(collectionsAmount, optionsFactory());
            await copyTest.templates(optionsFactory());
            sandbox = sinon.createSandbox();
        })
        afterEach('e2e test', async function(){
            await cleanTestDirectory();
            sandbox.restore();
        })
        it('runs for minimum options setup and returns results', async function(){
            let options = {
                folders: {collections: './test/collections/'}
            }
            let _mocked = runnerFactory();

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            let runResults = await runner.runTests();
            expect(_runs.args.length).to.equal(collectionsAmount);
            for (let i = 0; i < collectionsAmount; i++){
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (i+1) +'_col.json');
            }
            
            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(1);
            expect(reportFiles[0]).to.equal('yolo-all_folders.html');
            expect(runResults.length).to.equal(collectionsAmount);

            fs.unlinkSync(options.folders.reports + 'yolo-all_folders.html');
            await fs.rmdirSync(options.folders.reports, {recursive: true});
        })
        it('runs for all collections and generates report', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            delete options.specific_collection_items_to_run;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            await runner.runTests();
            expect(_runs.args.length).to.equal(collectionsAmount);
            for (let i = 0; i < collectionsAmount; i++){
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (i+1) +'_col.json');
            }
            
            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(1);
            expect(reportFiles[0]).to.equal('yolo-all_folders.html');
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
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (c + 1) +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + (e + 1) +'_env.json');
                if ((i+1) % collectionsAmount == 0) { c++; e = -1}
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(1);
        })
        it('runs for selected folders on all collections & environments', async function(){
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            await runner.runTests();
            for (let i = 0, c = 0, e = 0, f = 0; i < collectionsAmount*collectionsAmount*options.specific_collection_items_to_run.length; i++, f++){
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
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + c +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + e +'_env.json');
                expect(_runs.args[i][0].folder).to.equal(testFolders[(f-1)]);
                if ((i+1) % 3 == 0) { f = 0; } f++;
                if ((i+1) % (collectionsAmount*collectionsAmount) == 0) { c++, e = 0 }
                if ((i+1) % collectionsAmount == 0) { e++; }
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(testFolders.length);
        })
    })
    describe('#data file(s) driven runs', function(){
        let collectionsAmount = 3;
        beforeEach(async function(){
            await createTestFolders(optionsFactory());
            await copyTest.collections(collectionsAmount, optionsFactory());
            await copyTest.templates(optionsFactory());
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
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + (c) +'_col.json');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + (d) +'_data.json');
                if ((i+1) % (collectionsAmount) == 0) { c = 0; d++}
            } 

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(collectionsAmount);
        })
        it('runs for all collectons & environments & data files', async function(){
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

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(collectionsAmount);
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
                expect(_runs.args[i][0].collection).to.equal(options.folders.collections + c +'_col.json');
                expect(_runs.args[i][0].environment).to.equal(options.folders.environments + e +'_env.json');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + d +'_data.json');
                expect(_runs.args[i][0].folder).to.equal(testFolders[(f-1)]);
                if ((i+1) % 3 == 0) { f = 0; } f++;
                if ((i+1) % (collectionsAmount*collectionsAmount*3) == 0 ) {c = 0; d++}
                if ((i+1) % (collectionsAmount*collectionsAmount) == 0) { c++, e = 0 }
                if ((i+1) % collectionsAmount == 0) { e++; }
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(collectionsAmount*testFolders.length);           
        })
    })
})    