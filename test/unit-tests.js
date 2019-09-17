import ('./test-utils');

describe('newman-async-runner [unit]', async function (done) {
    this.timeout(10000);
    let sandbox;
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
        before(async function () {
            sandbox = sinon.createSandbox();
        })
        afterEach(async function () {
            sandbox.restore();
        })
        it('should return undefined array when there are no collections fetched', async function () {
            let runner = runnerFactory({});
            expect(await runner.getCollections()).to.eql([undefined]);
        })
        it('calls fetchViaApi() for all api related options', async function(){
            const options = 'api-options';
            let runner = runnerFactory({api: options});
            let spy = sandbox.spy(runner, 'fetchViaApi')
            try{await runner.getCollections();}catch{}
            expect(spy.calledOnceWith(options)).true;
        })
        it('calls fetchViaFileSystem() for all local related options', async function(){
            const options = 'fileSystem-options';
            let runner = runnerFactory({local: options});
            let spy = sandbox.spy(runner, 'fetchViaFileSystem')
            try{await runner.getCollections();}catch{}
            expect(spy.calledOnceWith(options)).true;
        })
        it('calls fetchViaHttp() for all http related options', async function(){
            const options = 'http-options';
            let runner = runnerFactory({http: options});
            let spy = sandbox.spy(runner, 'fetchViaHttp')
            try{await runner.getCollections();}catch{}
            expect(spy.calledOnceWith(options)).true;
        })
        it('returns api-http-local fetched collection objects arrays as single collections objects array', async function(){
            const apiOptions = ['c1', 'c2', 'c3'];
            const localOptions = ['c1', 'c2'];
            const httpOptions = ['c4'];
            const runner = runnerFactory({api: apiOptions, http: httpOptions, local: localOptions});
            sandbox.stub(runner, 'fetchViaApi').returns(apiOptions);
            sandbox.stub(runner, 'fetchViaHttp').returns(httpOptions);
            sandbox.stub(runner, 'fetchViaFileSystem').returns(localOptions);
            const returnedCollections = await runner.getCollections();

            expect(returnedCollections).to.have.members(new Array().concat(apiOptions, httpOptions, localOptions));
        })
        it('it ignores undefined api-http-local options', async function(){
            const runner = runnerFactory({});
            const returnedCollections = await runner.getCollections();
            expect(returnedCollections).to.eql([undefined]);
        })
        it('returns collections pre-fetched data if defined', async function(){
            const runner = runnerFactory({});
            runner.collectionsFetchedData = 'something';
            expect(await runner.getCollections()).equals('something');

            delete runner.collectionsFetchedData;
            expect(await runner.getCollections()).not.equals('something');
        })
        it('stores fetched data', async function(){
            const apiOptions = ['c1', 'c2', 'c3'];
            const localOptions = ['c1', 'c2'];
            const httpOptions = ['c4'];
            const runner = runnerFactory({api: apiOptions, http: httpOptions, local: localOptions});
            sandbox.stub(runner, 'fetchViaApi').returns(apiOptions);
            sandbox.stub(runner, 'fetchViaHttp').returns(httpOptions);
            sandbox.stub(runner, 'fetchViaFileSystem').returns(localOptions);

            expect(runner.collectionsFetchedData).to.be.undefined;
            await runner.getCollections();
            expect(runner.collectionsFetchedData).to.have.members(new Array().concat(apiOptions, localOptions, httpOptions));
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
        before('before #fetchViaApi() tests', async function(){
            sandbox = sinon.createSandbox();
        })
        afterEach('after #fetchViaApi() tests', async function(){
            sandbox.restore();
        })
        it('fetches all collection_names')
        it('fetches all collection_uids')
        it('fetches all collection_ids')
        it('uses minimal required api calls')
        it('returns array of all fetched collection objects')
        it('returns empty array if no collections are fetched')
        it('re-throws friendly error on request error')
        it('throws acumulated error msg for all not found resources')
    })
    describe('#fetchViaFileSystem', function(){
        it('fetches single collection')
        it('fetches multiple collections')
        it('fetches single environment')
        it('fetches multiple environments')
        it('throws error on invalid file content')
        it('throws error on invalid path')
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