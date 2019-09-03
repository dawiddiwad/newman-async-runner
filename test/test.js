describe('newman-async-runner tests',  function(){
    let 
        assert,
        _nar,
        runnerOptions;
    
    before(function(){
        assert = require('assert');
        _nar = require('../newman-async-runner'); 

        runnerOptions = {
            parallelFolderRuns: false,                                  
            folders: {
                collections:'./test/collections/',                        
                environments: './test/environments/',                       
                reports: './test/reports/',                                 
                data: './test/data/',                                        
                templates: './test/templates/'},                             
            reporter_template: 'htmlreqres.hbs',                        
            specific_collection_items_to_run: ['folder1 Copy', 'LUZEM']    
        };
    })
    describe('#setupFolders()',  function(){
        let directory;
        before(async function(){
            await new _nar.NewmanRunner(runnerOptions).setupFolders();
            directory = await fs.readdirSync('./test/');
        })
        after(async function(){
            for (let folder in runnerOptions.folders){
                await fs.rmdirSync(runnerOptions.folders[folder]);
            }
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
            await fs.mkdirSync(runnerOptions.folders.collections, {recursive: true});
            await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection.json');
            await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection2.json');
            collectionObjects = await new _nar.NewmanRunner(runnerOptions).getCollections();
        })
        after(async function(){
            try{
                await fs.unlinkSync('./test/collections/yolo.postman_collection.json')
                await fs.unlinkSync('./test/collections/yolo.postman_collection2.json')
                await fs.rmdirSync(runnerOptions.folders.collections);
            } catch{}
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
            await fs.mkdirSync(runnerOptions.folders.environments, {recursive: true});
            await fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment.json');
            await fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment2.json');
            environmentObjects = await new _nar.NewmanRunner(runnerOptions).getEnvironments();
        })
        after(async function(){
            try{
                await fs.unlinkSync('./test/environments/UAT.postman_environment.json')
                await fs.unlinkSync('./test/environments/UAT.postman_environment2.json')
                await fs.rmdirSync(runnerOptions.folders.environments);
            } catch{}
        })
        it('should generate environments', async function(){    
            assert.equal(environmentObjects.length, 2);        
        })
        it('environment has address', async function(){
            assert.equal(environmentObjects[0].address, './test/environments/UAT.postman_environment.json');
            assert.equal(environmentObjects[1].address, './test/environments/UAT.postman_environment2.json');
        })
        it('environment has name', async function(){
            assert.equal(environmentObjects[0].name, 'UAT');
            assert.equal(environmentObjects[1].name, 'UAT');
        })
    })
    describe('#annonymizeReportsPassword()', function(){
        let reportFiles = new Array();
        before(async function(){
            await fs.mkdirSync(runnerOptions.folders.reports, {recursive: true});
            await fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders.html');
            await fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders2.html');
            await new _nar.NewmanRunner(runnerOptions).annonymizeReportsPassword();
            let reportsDirFiles = await fs.readdirSync('./test/reports/', 'utf8');
            for (file of reportsDirFiles){
                reportFiles.push(await fs.readFileSync('./test/reports/' + file, 'utf8'));
            }
        })
        after(async function(){
            try{
                let reportsDirFiles = await fs.readdirSync('./test/reports/', 'utf8');
                for (file of reportsDirFiles){
                    await fs.unlinkSync('./test/reports/' + file)
                }
                await fs.rmdirSync(runnerOptions.folders.reports);
            } catch{}
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
        before(function(){
            runnerOptions_copy = runnerOptions;

            collection.address = './test/test - abcd.json';
            collection.content = 'test content';
            collection.name = 'test - abcd';
            collection.folders = ['folder 1', 'folder 2', 'folder 3'];

            environment.address = './test/test - abcd.json';
            environment.name = 'test - abcd';

            data = 'test data.csv';
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
            runnerOptions_copy = runnerOptions;
            runnerOptions_copy.folders.data = './data to test/'
            collection.address = './test/test - abcd.json';
            collection.content = 'test content';
            collection.name = 'test - abcd';
            collection.folders = ['folder 1', 'folder 2', 'folder 3'];
            environment.address = './test/test - abcd.json';
            environment.name = 'test - abcd';
            data = 'test data.csv';

            _narMock = _nar;
            _narMock.newman.run = function(options){
                assert.equal(options.collection, './test/test - abcd.json');
                assert.equal(options.environment, './test/test - abcd.json');
                assert.equal(options.folder, undefined);
                assert.equal(options.iterationData, './data to test/' + 'test data.csv');
            }
            delete runnerOptions_copy.specific_collection_items_to_run;
            runnerOptions_copy.parallelFolderRuns = false; 
            nar = new _narMock.NewmanRunner(runnerOptions_copy);
            nar.prepareRunOptions(collection, environment, 'folder 2', data);
            await async.parallel(nar.collectionRuns, function (err, results){
		    });
        })
        it('puts correct data for folder runs', async function(){
            runnerOptions_copy = runnerOptions;
            runnerOptions_copy.folders.data = './data to test/'
            collection.address = './test/test - abcd.json';
            collection.content = 'test content';
            collection.name = 'test - abcd';
            collection.folders = ['folder 1', 'folder 2', 'folder 3'];
            environment.address = './test/test - abcd.json';
            environment.name = 'test - abcd';
            data = 'test data.csv';

            _narMock = _nar;
            _narMock.newman.run = function(options){
                assert.equal(options.collection, './test/test - abcd.json');
                assert.equal(options.environment, './test/test - abcd.json');
                assert.equal(options.folder, 'folder 2');
                assert.equal(options.iterationData, './data to test/' + 'test data.csv');
            }
            runnerOptions_copy.specific_collection_items_to_run = ['folder 2'];
            runnerOptions_copy.parallelFolderRuns = false; 
            nar = new _narMock.NewmanRunner(runnerOptions_copy);
            nar.prepareRunOptions(collection, environment, 'folder 2', data);
            await async.parallel(nar.collectionRuns, function (err, results){
		    });
        })
    })
})