import ('./test-utils');

describe('newman-async-runner [unit]', async function (done) {
    let
        assert,
        _nar,
        sandbox,
        runnerOptions;
    function resetOptions() {
        runnerOptions = {
            parallelFolderRuns: false,
            folders: {
                collections: './test/collections/',
                environments: './test/environments/',
                reports: './test/reports/',
                data: './test/data/',
                templates: './test/templates/'
            },
            reporter_template: 'htmlreqres.hbs',
            anonymizeFilter: 'rebelia',
            specific_collection_items_to_run: ['folder1 Copy', 'LUZEM']
        };
    }

    before(function () {
        this.timeout(10000);
        assert = require('assert');
        _nar = runnerFactory();
        resetOptions();
    })
    describe('#setupFolders()', function () {
        let directory;
        before(async function () {
            await cleanTestDirectory();
            await fs.mkdirSync('./test/reports/');
            await new _nar.NewmanRunner(optionsFactory()).setupFolders();
            directory = fs.readdirSync('./test/');
        })
        after(async function () {
            await cleanTestDirectory();
        })
        it('directory should contain folder: collections', function () {
            assert(directory.includes('collections'), true);
        })
        it('directory should contain folder: environments', function () {
            assert(directory.includes('environments'), true);
        })
        it('directory should contain folder: reports', function () {
            assert(directory.includes('reports'), true);
        })
        it('directory should contain folder: data', function () {
            assert(directory.includes('data'), true);
        })
        it('directory should contain folder: templates', function () {
            assert(directory.includes('templates'), true);
        })
        it('should not create directories for single files', async function(){
            let options = optionsFactory();
            await cleanTestDirectory();
            options.folders.environments = './test/environments/1_env.json';
            createTestFolders(optionsFactory());
            copyTest.all(1, optionsFactory());

            await new _nar.NewmanRunner(options).setupFolders();
            directory = fs.readdirSync('./test/');
            expect(directory).to.not.include(options.folders.environments);
        })
        it('throws error when no collections folder is set in runner options', async function () {
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
            let options = new Object();
            let _mocked = runnerFactory();
            let runner = new _mocked.NewmanRunner(options);
            try {
                await runner.setupFolders();
            } catch (error) {
                expect(error).to.be.a('Error');
                expect(error.message).to.equal('undefined collections path in {runnerOptions.folders} -> Please define at least that :)');
            }
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
        })
    })
    describe('#getCollections()', function () {
        let collectionObjects;
        before(async function () {
            await createTestFolders(optionsFactory());
            await fs.mkdirSync(runnerOptions.folders.collections, { recursive: true });
            await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection.json');
            await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection2.json');
            collectionObjects = await new _nar.NewmanRunner(runnerOptions).getCollections();
        })
        after(async function () {
            await cleanTestDirectory();
        })
        it('should generate collections', async function () {
            assert.equal(collectionObjects.length, 2);
        })
        it('collection has address', async function () {
            assert.equal(collectionObjects[0].address, './test/collections/yolo.postman_collection.json');
            assert.equal(collectionObjects[1].address, './test/collections/yolo.postman_collection2.json');
        })
        it('collection has name', async function () {
            assert.equal(collectionObjects[0].name, 'yolo');
            assert.equal(collectionObjects[1].name, 'yolo');

        })
        it('collections has folders', async function () {
            assert.equal(collectionObjects[0].folders.length, 3);
            assert.equal(collectionObjects[1].folders.length, 3);
        })
        it('collection has correct folders content', async function () {
            assert.equal(collectionObjects[0].folders[0], 'folder1');
            assert.equal(collectionObjects[0].folders[1], 'folder1 Copy');
            assert.equal(collectionObjects[0].folders[2], 'LUZEM');
            assert.equal(collectionObjects[1].folders[0], 'folder1');
            assert.equal(collectionObjects[1].folders[1], 'folder1 Copy');
            assert.equal(collectionObjects[1].folders[2], 'LUZEM');
        })
        it('should return undefined array when there are no collection folders', async function () {
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner({});
            expect(await runner.getCollections()[0]).to.be.undefined;

            runner = new runnerFactory();
            runner = new runner.NewmanRunner({ options: null });
            expect(await runner.getCollections()[0]).to.be.undefined;

            runner = new runnerFactory();
            runner = new runner.NewmanRunner({ options: { folders: {} } });
            expect(await runner.getCollections()[0]).to.be.undefined;
        })
        it('read single file collection', async function () {
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner({folders: {collections: './test/collections/yolo.postman_collection.json'}});

            let collections = await runner.getCollections();
            expect(collections.length).to.equal(1);
            expect(collections[0].name).to.equal('yolo');
            expect(collections[0].folders[0]).to.equal('folder1');
            expect(collections[0].folders[1]).to.equal('folder1 Copy');
            expect(collections[0].folders[2]).to.equal('LUZEM');
        })
        it('calls postman api when path does not exist locally')
    })
    describe('#getEnvironments()', function () {
        let environmentObjects;
        before(async function () {
            await createTestFolders(optionsFactory());
            await fs.mkdirSync(runnerOptions.folders.environments, { recursive: true });
            await fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment.json');
            await fs.copyFileSync('./test/testdata/environments/UAT.postman_environment.json', './test/environments/UAT.postman_environment2.json');
            environmentObjects = await new _nar.NewmanRunner(runnerOptions).getEnvironments();
        })
        after(async function () {
            await cleanTestDirectory();
        })
        it('should generate environments', function () {
            assert.equal(environmentObjects.length, 2);
        })
        it('should return undefined array if no environments path is specified', async function () {
            copyOptions = JSON.parse(JSON.stringify(runnerOptions));
            delete copyOptions.folders.environments;
            let returnEnvironments = await new _nar.NewmanRunner(copyOptions).getEnvironments();
            assert.deepEqual(returnEnvironments, [undefined]);
        })
        it('environment has address', function () {
            assert.equal(environmentObjects[0].address, './test/environments/UAT.postman_environment.json');
            assert.equal(environmentObjects[1].address, './test/environments/UAT.postman_environment2.json');
        })
        it('environment has name', function () {
            assert.equal(environmentObjects[0].name, 'UAT');
            assert.equal(environmentObjects[1].name, 'UAT');
        })
        it('read single file environment', async function () {
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner({folders: {environments: './test/environments/UAT.postman_environment.json'}});

            let environments = await runner.getEnvironments();
            expect(environments.length).to.equal(1);
            expect(environments[0].name).to.equal('UAT');
        })
        it('throws error when unable to find directory or file', async function () {
            let runner = new runnerFactory();
            let environmentsPath = './test/environments/UAT.postman_environment_INVALID.json';
            runner = new runner.NewmanRunner({folders: {environments: environmentsPath}});

            let didThrowError = false;
            try{
                await runner.getEnvironments();
            } catch(error){
                expect(error).to.be.a('Error');
                expect(error.message).to.equal('environments path: ' + environmentsPath + ' does not exist or is invalid, unable to generate newman runs')
                didThrowError = true;
            }
            expect(didThrowError).to.be.true;
        })
        it('throws error when given directory is neither directory or file', async function () {
            let runner = new runnerFactory();
            let environmentsPath = new net.Socket();
            runner = new runner.NewmanRunner({folders: {environments: environmentsPath}});

            let didThrowError = false;
            try{
                await runner.getEnvironments();
            } catch(error){
                expect(error).to.be.a('Error');
                expect(error.message).to.equal('environments path: ' + environmentsPath + ' does not exist or is invalid, unable to generate newman runs')
                didThrowError = true;
            }
            expect(didThrowError).to.be.true;
        })
    })
    describe('#anonymizeReportsPassword()', function () {
        let reportFiles = new Array();
        before(async function () {
            await createTestFolders(optionsFactory());
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = 'rebelia';

            fs.mkdirSync(runnerOptions_copy.folders.reports, { recursive: true });
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders.html');
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders2.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let reportsDirFiles = fs.readdirSync('./test/reports/', 'utf8');
            for (file of reportsDirFiles) {
                reportFiles.push(fs.readFileSync('./test/reports/' + file, 'utf8'));
            }
        })
        after(async function () {
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
        })
        it('removes password', function () {
            for (file of reportFiles) {
                expect(file).to.not.include('123DuP@321');
            }
        })
        it('puts *** in place of password', function () {
            for (file of reportFiles) {
                expect(file).to.include('***');
            }
        })
        it('utilizes custom anonymize filter', async function () {
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let file = fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

            expect(file).to.not.include('lt;n1:password&gt');
            expect(file).to.include('lt;n1:***&gt');
        })
        it('does not anonymize report when requeired', async function () {
            let runnerOptions_copy = runnerOptions;
            runnerOptions_copy.anonymizeFilter = /(?<=&lt;n1:)(.*?)*(?=&gt;)/g;
            delete runnerOptions_copy.anonymizeFilter;
            fs.copyFileSync('./test/testdata/reports/snippets-UAT-all_folders.html', './test/reports/snippets-UAT-all_folders3.html');
            await new _nar.NewmanRunner(runnerOptions_copy).anonymizeReportsPassword();
            let file = fs.readFileSync('./test/reports/snippets-UAT-all_folders3.html', 'utf8')

            expect(file).to.include('123DuP@321');
        })
        it('throws error when unable to access reports folder', async function () {
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner({
                options:
                    { folders: { reports: './dummy' } },
                anonymizeFilter: 'regex'
            });

            try {
                await runner.anonymizeReportsPassword();
            } catch (error) {
                expect(error).to.be.a('Error');
                expect(error.message).to.equal("could not open reports folder, reports were not anonymized, error occured: TypeError: Cannot read property 'reports' of undefined");
            }
            await createTestFolders(optionsFactory());
            await cleanTestDirectory();
        })
    })
    describe('#prepareRunOptions()', function () {
        let
            collection = new Object(),
            environment = new Object(),
            folder,
            data,
            result,
            runnerOptions_copy,
            nar;

        let prepareRunOptionsFor_iterateAllFolders = function (collection, environment, folders, data) {
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            for (folder of folders) {
                nar.prepareRunOptions(collection, environment, folder, data);
            }
        }
        beforeEach(async function () {
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
        afterEach(async function () {
            sandbox.restore();
            await cleanTestDirectory();
        })
        it('based on spcified folders', function () {
            runnerOptions_copy.specific_collection_items_to_run = [collectionFactory(1)[0].folders[0]];
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'csv')[0]);
            expect(nar.collectionRuns.length).to.equal(runnerOptions_copy.specific_collection_items_to_run.length)

            runnerOptions_copy.specific_collection_items_to_run = [collectionFactory(1)[0].folders[0], collectionFactory(1)[0].folders[2]];
            nar = new _nar.NewmanRunner(runnerOptions_copy);
            prepareRunOptionsFor_iterateAllFolders(collectionFactory(1)[0], environmentFactory(1)[0], collectionFactory(1)[0].folders, dataFactory(1, 'json')[0]);
            expect(nar.collectionRuns.length).to.equal(runnerOptions_copy.specific_collection_items_to_run.length)
        })
        it('with parallel folder runs count', function () {
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
            for (let i = 0; i < numberOfCollections; i++) {
                nar.prepareRunOptions(collectionFactory(1)[0], environmentFactory(1)[0], 'all_folders', dataFactory(1, 'json')[0]);
            }
            expect(nar.collectionRuns.length).to.equal(numberOfCollections);
        })
        it('puts correct data for whole collections runs', async function () {
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

            await async.parallel(NAR.collectionRuns, function () { });
            expect(runsSpy.args[0][0].collection).to.equal(collections[0].address);
            expect(runsSpy.args[0][0].environment).to.equal(environments[0].address);
            expect(runsSpy.args[0][0].iterationData).to.equal(dataFiles[0].address);
        })
        it('correctly handles non-environment runs', async function () {
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

            await async.parallel(NAR.collectionRuns, function () { });
            expect(runsSpy.args[0][0].collection).to.equal(collections[0].address);
            expect(runsSpy.args[0][0].environment).to.equal(undefined);
            expect(runsSpy.args[0][0].iterationData).to.equal(dataFiles[0].address);
        })
        it('puts correct data for folder runs', async function () {
            let options = optionsFactory();
            let collection = collectionFactory(1);
            options.specific_collection_items_to_run = [collection[0].folders[0], collection[0].folders[2]];

            let NAR = runnerFactory();
            NAR = new NAR.NewmanRunner(options);

            let collectionRunsSpy = sandbox.spy(NAR.collectionRuns, 'push');
            let runsSpy = sandbox.spy(runnerFactory().newman, 'run');

            for (let folder of collection[0].folders) {
                await NAR.prepareRunOptions(collection[0], undefined, folder, undefined);
            }
            await async.parallel(NAR.collectionRuns, function () { });

            //sinon.assert.calledTwice(collectionRunsSpy);
            expect(runsSpy.args[0][0].folder).to.equal(options.specific_collection_items_to_run[0]);
            expect(runsSpy.args[1][0].folder).to.equal(options.specific_collection_items_to_run[1]);
        })
        it('passes-trough external newmanOptions', async function () {
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

            for (let folder of collection[0].folders) {
                await NAR.prepareRunOptions(collection[0], undefined, folder, undefined);
            }
            await async.parallel(NAR.collectionRuns, function () { });
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
        it('throws error when no collections are defined for newman run', async function () {
            let runner = runnerFactory();
            runner = new runner.NewmanRunner(optionsFactory());
            try {
                runner.prepareRunOptions();
            } catch (error) {
                expect(error).to.be.a('Error');
                expect(error.message).to.include('undefined collection for newman run options')
            }
        })
        it('puts correct data for data runs')
        it('sets proper reporter template')
        it('gives proper name to test report')
    })
    describe('#getFiles', function(){
        let intialAmountOfFiles = 3;
        beforeEach('#getFiles() before each', async function () {
            await cleanTestDirectory();
            await createTestFolders(optionsFactory())
            await copyTest.data(intialAmountOfFiles, optionsFactory(), '.csv');
            await copyTest.data(intialAmountOfFiles, optionsFactory(), '.json');
        })
        afterEach('#getFiles() after each', async function () {
            await cleanTestDirectory();
        })
        it('should generate iteration data file objects', async function () {
            let runner = runnerFactory();
            runner = new runner.NewmanRunner(optionsFactory());

            let dataFiles = await runner.getFiles();
            expect(dataFiles.length).to.equal(intialAmountOfFiles*2);
            for (data of dataFiles){
                expect(data.address).to.equal(optionsFactory().folders.data + data.name);
            }
        })
        it('should return [undefined] if there are no data files', async function () {
            await cleanTestDirectory();
            await createTestFolders(optionsFactory())
            let runner = runnerFactory();
            runner = new runner.NewmanRunner(optionsFactory());

            let dataFiles = await runner.getFiles();
            expect(dataFiles.length).to.equal(1);
            expect(dataFiles[0]).to.be.undefined;
        })
        it('reads single .json and .csv data files', async function () {
            await cleanTestDirectory();
            await createTestFolders(optionsFactory())
            await copyTest.data(1, optionsFactory(), '.json');
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner({folders: {data: './test/data/1_data.json'}});

            let files = await runner.getFiles();
            expect(files.length).to.equal(1);
            expect(files[0].name).to.equal('1_data.json');

            await cleanTestDirectory();
            await createTestFolders(optionsFactory())
            await copyTest.data(1, optionsFactory(), '.csv');
            runner = new runnerFactory();
            runner = new runner.NewmanRunner({folders: {data: './test/data/1_data.csv'}});

            files = await runner.getFiles();
            expect(files.length).to.equal(1);
            expect(files[0].name).to.equal('1_data.csv');
        })
        it('throws error when unable to find directory or file', async function () {
            await cleanTestDirectory();
            let runner = runnerFactory();
            runner = new runner.NewmanRunner(optionsFactory());

            let didThrowError = false;
            try{
                await runner.getFiles();
            } catch(error){
                expect(error).to.be.a('Error');
                expect(error.message).to.equal('iteration data files path: ' + optionsFactory().folders.data + ' does not exist or is invalid, unable to generate newman runs');
                didThrowError = true;
            }
            expect(didThrowError).to.be.true;
        })
    })
    describe('#checkApiCollections()', function(){
        const pmApiKey = '?apikey=76daa939671b4014bea6737bf870e216';
        const pmCollectionsEndpoint = 'https://api.getpostman.com/collections/';
        beforeEach('before each #checkApiCollections() test', async function(){
            cleanTestDirectory();
        })
        afterEach('after each #checkApiCollections() test', async function(){
            cleanTestDirectory();
        })
        it('returns single postman collection object', async function(){
            let pmCollectionUid = '5022740-1106110a-7550-48e9-a083-eaa5e9b65d7d';
            let uri = pmCollectionsEndpoint + pmCollectionUid + pmApiKey;
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner(optionsFactory());
            let result = await runner.checkApiCollections(uri);

            expect(result.length).to.equal(1);
            expect(result[0].address).to.equal(uri);
            expect(result[0].name).to.equal('yolo');
            expect(result[0].folders[0]).to.equal('folder1');
            expect(result[0].folders[1]).to.equal('folder1 Copy');
            expect(result[0].folders[2]).to.equal('LUZEM');
        })
        it('returns multiple postman collection objects', async function(){
            let uri = pmCollectionsEndpoint + pmApiKey;
            let runner = new runnerFactory();
            runner = new runner.NewmanRunner(optionsFactory());
            let result = await runner.checkApiCollections(uri);

            expect(result.length).to.equal(3);
            expect(result[0].name).to.equal('yolo');
            expect(result[0].folders[0]).to.equal('folder1');
            expect(result[0].folders[1]).to.equal('folder1 Copy');
            expect(result[0].folders[2]).to.equal('LUZEM');

        })
        // it('returns single postman collection object')
        // it('throws error when unable to fetch collection using given uri')
        // it('throws error when given uri request throws error')
    })
})