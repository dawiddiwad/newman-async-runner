import ('./test-utils');

describe('newman-async-runner [unit]', async function (done) {
    this.timeout(10000);
    const pmCollectionsEndpoint = 'https://api.getpostman.com/collections/';
    const pmEnvironmentsEndpoint = 'https://api.getpostman.com/environments/';
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
        assert = require('assert');
        _nar = runnerFactory();
        resetOptions();
    })
    describe('#setupFolders()', function () {
        it('throws error when no collections folder is set in runner options', async function () {
            let options = new Object();
            let runner = runnerFactory();
            runner = new runner.NewmanRunner(options);
            try {
                await runner.setupFolders();
            } catch (error) {
                expect(error).to.be.a('Error');
                expect(error.message).to.equal('undefined collections path in {runnerOptions.folders} -> Please define at least that :)');
            }
        })
        it('adds reports folder to runner options if missing', async function(){
            let options = optionsFactory();
            delete options.folders.reports;
            let runner = runnerFactory();
            runner = new runner.NewmanRunner(options);
            await runner.setupFolders();

            expect(runner.options.folders.reports).to.equal('./reports/');
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
        it('collection has name', async function () {
            assert.equal(collectionObjects[0].name, 'yolo');
            assert.equal(collectionObjects[1].name, 'yolo');

        })
        it('collections has folders', async function () {
            assert.equal(collectionObjects[0].folders.length, 6);
            assert.equal(collectionObjects[1].folders.length, 6);
        })
        it('collection has correct folders content', async function () {
            expect(collectionObjects[0].folders[0]).to.equal('folder1');
            expect(collectionObjects[0].folders[1]).to.equal('TO');
            expect(collectionObjects[0].folders[2]).to.equal('folder1 Copy');
            expect(collectionObjects[0].folders[3]).to.equal('NIE TO');
            expect(collectionObjects[0].folders[4]).to.equal('folder2');
            expect(collectionObjects[0].folders[5]).to.equal('LUZEM');
            expect(collectionObjects[1].folders[0]).to.equal('folder1');
            expect(collectionObjects[1].folders[1]).to.equal('TO');
            expect(collectionObjects[1].folders[2]).to.equal('folder1 Copy');
            expect(collectionObjects[1].folders[3]).to.equal('NIE TO');
            expect(collectionObjects[1].folders[4]).to.equal('folder2');
            expect(collectionObjects[1].folders[5]).to.equal('LUZEM');
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
            expect(collections[0].folders[1]).to.equal('TO');
            expect(collections[0].folders[2]).to.equal('folder1 Copy');
            expect(collections[0].folders[3]).to.equal('NIE TO');
            expect(collections[0].folders[4]).to.equal('folder2');
            expect(collections[0].folders[5]).to.equal('LUZEM');
        })
        it('calls fetchViaApi() when path does not exist locally', async function(){
            sandbox = sinon.createSandbox();
            let runner = new runnerFactory();
            sandbox.stub(runnerFactory().NewmanRunner.prototype, 'fetchViaApi').callsFake(function(uri){
                return uri;
            });
            sandbox.stub(runnerFactory().NewmanRunner.prototype, 'fetchViaFileSystem').callsFake(function(uri){
                return 'fail';
            });

            runner = new runner.NewmanRunner({folders: {collections: pmCollectionsEndpoint}});
            expect(await runner.getCollections()).to.equal(pmCollectionsEndpoint);
            sandbox.restore();
        })
        it('calls fetchViaFileSystem() when path does not exist locally', async function(){
            sandbox = sinon.createSandbox();
            let runner = new runnerFactory();
            sandbox.stub(runnerFactory().NewmanRunner.prototype, 'fetchViaApi').callsFake(function(uri){
                return 'fail';
            });
            sandbox.stub(runnerFactory().NewmanRunner.prototype, 'fetchViaFileSystem').callsFake(function(uri){
                return uri;
            });

            runner = new runner.NewmanRunner({folders: {collections: './'}});
            expect(await runner.getCollections()).to.equal('./');
            sandbox.restore();
        })
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
            expect(runsSpy.args[0][0].collection).to.equal(collections[0].content);
            expect(runsSpy.args[0][0].environment).to.equal(environments[0].content);
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
            expect(runsSpy.args[0][0].collection).to.equal(collections[0].content);
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
    describe('#fetchViaApi', function(){
        let apiKey;
        let SingleCollectionUid;
        let SingleEnvironmentUid;
        before('before #fetchViaApi() tests', async function(){
            apiKey = await getApiKey();
            SingleCollectionUid = '8804262-13f4c16b-dcbb-4440-8198-d60f9061eaff';
            SingleEnvironmentUid = '8804262-7b563f42-8bed-4ed7-aba7-7eca1e0d6230';
        })
        it('fetches single collection', async function(){
            const collectionPath = pmCollectionsEndpoint + SingleCollectionUid + apiKey;
            let runner = runnerFactory();
            runner = new runner.NewmanRunner({folders: {collections: collectionPath}});

            const result = await runner.fetchViaApi(collectionPath);
            expect(result).to.be.a('Array');
            expect(result.length).equals(1);
            expect(result[0].content).to.have.property('info');
        })
        it('fetches multiple collections', async function(){
            const collectionPath = pmCollectionsEndpoint + apiKey;
            let runner = runnerFactory();
            runner = new runner.NewmanRunner({folders: {collections: collectionPath}});

            const result = await runner.fetchViaApi(collectionPath);
            expect(result).to.be.a('Array');
            expect(result.length).equals(3);
            expect(result[0].name).not.equals(result[1].name);
        })
        it('fetches single environment', async function(){
            const environmentPath = pmEnvironmentsEndpoint + SingleEnvironmentUid + apiKey;
            let runner = runnerFactory();
            runner = new runner.NewmanRunner({folders: {collections: environmentPath}});

            const result = await runner.fetchViaApi(environmentPath);
            expect(result).to.be.a('Array');
            expect(result.length).equals(1);
            expect(result[0].content).to.have.property('name');
            expect(result[0].content).not.to.have.property('info');
        })
        it('fetches multiple environments', async function(){
            const environmentPath = pmEnvironmentsEndpoint + apiKey;
            let runner = runnerFactory();
            runner = new runner.NewmanRunner({folders: {collections: environmentPath}});

            const result = await runner.fetchViaApi(environmentPath);
            expect(result).to.be.a('Array');
            expect(result.length).equals(2);
            expect(result[0].name).not.equals(result[1].name);
        })
        it('throws error on request exception', async function(){
            const uri = 'dummy';
            let runner = runnerFactory();
            runner = new runner.NewmanRunner({folders: {collections: uri}});

            let hasThrownError = false;
            try{
                await runner.fetchViaApi(uri);
            } catch(error){
                expect(error).to.be.a('Error');
                expect(error.message).equals('path: ' + uri +' does not exist or is invalid, unable to generate newman runs.\nCause: RequestError: Error: Invalid URI \"' + uri + '\"');
                hasThrownError = true;
            }
            expect(hasThrownError).to.be.true;
        })
        it('throws error on invalid uri', async function(){
            const uri = 'https://www.google.com';
            let runner = runnerFactory();
            runner = new runner.NewmanRunner({folders: {collections: uri}});

            let hasThrownError = false;
            try{
                await runner.fetchViaApi(uri);
            } catch(error){
                expect(error).to.be.a('Error');
                hasThrownError = true;
            }
            expect(hasThrownError).to.be.true;
        })
    })
    describe('#fetchViaFileSystem', function(){
        it('fetches single collection')
        it('fetches multiple collections')
        it('fetches single environment')
        it('fetches multiple environments')
        it('throws error on invalid file content')
        it('throws error on invalid path')
    })
    describe('#handleCollection', function(){
        it('returns new Collections object for given collection json')
    })
    describe('#handleEnvironment', function(){
        it('returns new Environment object for given environment json')
    })
    describe('#setupCollections', function(){
        it('runs for each data file')
        it('runs for each collection')
        it('runs for each environment')
        it('runs for selected items')
        it('runs for parallel items')
        it('runs for all items')
    })
    describe('#runTests', function(){
        it('triggers async runs setup and then launches tests')
        it('returns result after all runs are completed')
    })

})