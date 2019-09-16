import ('./test-utils');

describe('newman-async-runner [e2e]', async function () {
    this.timeout(120000);
    let sandbox;
    describe('#non-data driven runs', function () {
        let collectionsAmount = 3;
        beforeEach('e2e test', async function () {
            await createTestFolders(optionsFactory());
            await copyTest.collections(collectionsAmount, optionsFactory());
            await copyTest.templates(optionsFactory());
            sandbox = sinon.createSandbox();
        })
        afterEach('e2e test', async function () {
            await cleanTestDirectory();
            sandbox.restore();
        })
        it('runs for minimum options setup and returns results', async function () {
            let options = {
                folders: { collections: './test/collections/'}, newmanOptions: {reporters: 'htmlfull'}
            }
            let _mocked = runnerFactory();

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            let runResults = await runner.runTests();
            for (eachResult of runResults){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            expect(_runs.args.length).to.equal(collectionsAmount);
            for (let i = 0; i < collectionsAmount; i++) {
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].folder).to.be.undefined;
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(1);
            expect(reportFiles[0]).to.equal('yolo-all_folders.html');
            expect(runResults.length).to.equal(collectionsAmount);

            fs.unlinkSync(options.folders.reports + 'yolo-all_folders.html');
            await fs.rmdirSync(options.folders.reports, { recursive: true });
        })
        it('runs for all collections and generates report', async function () {
            let options = optionsFactory();
            let _mocked = runnerFactory();
            delete options.specific_collection_items_to_run;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            expect(_runs.args.length).to.equal(collectionsAmount);
            for (let i = 0; i < collectionsAmount; i++) {
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].folder).to.be.undefined;
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(1);
            expect(reportFiles[0]).to.equal('yolo-all_folders.html');
        })
        it('runs for all collections & environments', async function () {
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            delete options.specific_collection_items_to_run;
            delete options.parallelFolderRuns;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            for (let i = 0, c = 0, e = 0; i < collectionsAmount * collectionsAmount; i++ , e++) {
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].environment.name).to.equal('UAT');
                expect(_runs.args[i][0].folder).to.be.undefined;
                if ((i + 1) % collectionsAmount == 0) { c++; e = -1 }
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(1);
        })
        it('runs for selected folders on all collections & environments', async function () {
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            delete options.parallelFolderRuns;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            for (let i = 0, c = 0, e = 0, f = 0; i < collectionsAmount * collectionsAmount * options.specific_collection_items_to_run.length; i++ , f++) {
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].environment.name).to.equal('UAT');
                expect(_runs.args[i][0].folder).to.equal(options.specific_collection_items_to_run[f]);
                if ((i + 1) % (collectionsAmount * options.specific_collection_items_to_run.length) == 0) { c++; e = -1 }
                if ((i + 1) % options.specific_collection_items_to_run.length == 0) { f = -1; e++; }
            }
        })
        it('parallel folder runs on all collections & environments', async function () {
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            delete options.specific_collection_items_to_run;
            options.parallelFolderRuns = true;
            let runner = new _mocked.NewmanRunner(options);

            let testFolders = ['folder1', 'TO', 'folder1 Copy', 'NIE TO', 'folder2', 'LUZEM'];

            let _runs = sandbox.spy(_mocked.newman, 'run');
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            for (let i = 0, c = 1, e = 1, f = 1; i < collectionsAmount * collectionsAmount * 6; i++) {
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].environment.name).to.equal('UAT');
                expect(_runs.args[i][0].folder).to.equal(testFolders[(f - 1)]);
                if ((i + 1) % 6 == 0) { f = 0; } f++;
                if ((i + 1) % (collectionsAmount * collectionsAmount) == 0) { c++ , e = 0 }
                if ((i + 1) % collectionsAmount == 0) { e++; }
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(testFolders.length);
        })
    })
    describe('#data file(s) driven runs', function () {
        let collectionsAmount = 3;
        beforeEach(async function () {
            await createTestFolders(optionsFactory());
            await copyTest.collections(collectionsAmount, optionsFactory());
            await copyTest.templates(optionsFactory());
            sandbox = sinon.createSandbox();
        })
        afterEach(async function () {
            await cleanTestDirectory();
            sandbox.restore();
        })
        it('runs for collections & data files', async function () {
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.data(collectionsAmount, options);
            delete options.specific_collection_items_to_run;
            delete options.parallelFolderRuns;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            for (let i = 0, c = 1, d = 1; i < collectionsAmount * collectionsAmount; i++ , c++) {
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + (d) + '_data.json');
                expect(_runs.args[i][0].folder).to.be.undefined;
                if ((i + 1) % (collectionsAmount) == 0) { c = 0; d++ }
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(collectionsAmount);
        })
        it('runs for all collectons & environments & data files', async function () {
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            await copyTest.data(collectionsAmount, options);
            delete options.specific_collection_items_to_run;

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            for (let i = 0, c = 0, e = 0, d = 0; i < collectionsAmount * collectionsAmount * collectionsAmount; i++ , e++) {
                console.log(_runs.args[i][0].collection + ' ' + _runs.args[i][0].environment + ' ' + _runs.args[i][0].iterationData);
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].environment.name).to.equal('UAT');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + (d + 1) + '_data.json');
                expect(_runs.args[i][0].folder).to.be.undefined;
                if ((i + 1) % (collectionsAmount * collectionsAmount) == 0) { c = 0; e = -1; d++; continue; }
                if ((i + 1) % collectionsAmount == 0) { c++; e = -1 }
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(collectionsAmount);
        })
        it('runs for all collectons & environments & data single files', async function () {
            let options = optionsFactory();
            options.folders.collections = './test/collections/1_col.json';
            options.folders.environments = './test/environments/1_env.json';
            options.folders.data = './test/data/1_data.json';
            delete options.specific_collection_items_to_run;
            await copyTest.all(collectionsAmount, optionsFactory());

            let _mocked = runnerFactory();
            await copyTest.environments(collectionsAmount, options);
            await copyTest.data(collectionsAmount, options);

            let _runs = sandbox.spy(_mocked.newman, 'run');
            let runner = new _mocked.NewmanRunner(options);
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            expect(_runs.args.length).to.equal(1);
            expect(_runs.args[0][0].collection.info.name).to.equal('yolo');
            expect(_runs.args[0][0].environment.name).to.equal('UAT');
            expect(_runs.args[0][0].iterationData).to.equal(options.folders.data);
            expect(_runs.args[0][0].folder).to.be.undefined;

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(1);
        })
        it('parallel folder runs on all collections & environments & data files', async function () {
            let options = optionsFactory();
            let _mocked = runnerFactory();
            await copyTest.environments(1, options);
            await copyTest.data(2, options);
            delete options.specific_collection_items_to_run;
            options.parallelFolderRuns = true;
            let runner = new _mocked.NewmanRunner(options);

            let testFolders = ['folder1', 'TO', 'folder1 Copy', 'NIE TO', 'folder2', 'LUZEM'];

            let _runs = sandbox.spy(_mocked.newman, 'run');
            const results = await runner.runTests();
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            for (let i = 0, c = 1, e = 1, f = 1, d = 1; i < collectionsAmount * 1 * testFolders.length * 2; i++) {
                expect(_runs.args[i][0].collection.info.name).to.equal('yolo');
                expect(_runs.args[i][0].environment.name).to.equal('UAT');
                expect(_runs.args[i][0].iterationData).to.equal(options.folders.data + d + '_data.json');
                expect(_runs.args[i][0].folder).to.equal(testFolders[(f - 1)]);
                if ((i + 1) % testFolders.length == 0) { f = 0; } f++;
                if ((i + 1) % (collectionsAmount * 1 * testFolders.length) == 0) { c = 0; d++ }
                if ((i + 1) % (collectionsAmount * 2) == 0) { c++ , e = 0 }
                if ((i + 1) % collectionsAmount == 0) { e++; }
            }

            let reportFiles = await getReportsFrom(options.folders.reports);
            expect(reportFiles.length).to.equal(testFolders.length * 2);
        })
    })
    describe('#api runs', function(){
        apiKey = 'dd';
        before('before api runs tests', async function(){
            sandbox = sinon.createSandbox();
        })
        afterEach('after api runs tests', async function(){
            sandbox.restore();
        })
        it('runs for single collection and environment fetched via postman api', async function(){
            await cleanTestDirectory();
            let runner = runnerFactory();
            sandbox.stub(global, 'request').callsFake(callPostmanApi);
            runner = new runner.NewmanRunner({
                folders: {
                    collections: api_snippets,
                    environments: api_UAT,
                    reports: './test/reports/'},
                newmanOptions: {reporters: 'htmlfull', timeoutRequest: 100}
            });
            let results = await runner.runTests();
            expect(results.length).equals(1);
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            expect(results[0].summary.collection.name).equals('snippets');
            expect(results[0].summary.environment.name).equals('UAT');
            await cleanTestDirectory();
        })
        it('runs for all collections and environments fetched via postman api', async function(){
            await cleanTestDirectory();
            let runner = runnerFactory();
            sandbox.stub(global, 'request').callsFake(callPostmanApi);
            runner = new runner.NewmanRunner({
                folders: {
                    collections: api_collectionsEndpoint,
                    environments: api_environmentsEndpoint,
                    reports: './test/reports/'},
                newmanOptions: {reporters: 'htmlfull', timeoutRequest: 100}
            });

            let results = await runner.runTests();
            expect(results.length).equals(6);
            for (eachResult of results){
                expect(eachResult.summary.run.executions).not.to.be.empty;
            }
            expect(results[0].summary.collection.name).not.equals(results[2].summary.collection.name);
            expect(results[0].summary.environment.name).not.equals(results[1].summary.environment.name);
            await cleanTestDirectory();
        })
        it('runs for all collections, environments and data files fetched via postman api', async function(){
            await cleanTestDirectory();
            await createTestFolders(optionsFactory());
            await copyTest.data(1, optionsFactory(), '.json');
            await copyTest.data(1, optionsFactory(), '.csv');
            let runner = runnerFactory();
            sandbox.stub(global, 'request').callsFake(callPostmanApi);
            runner = new runner.NewmanRunner({
                folders: {
                    collections: api_collectionsEndpoint,
                    environments: api_environmentsEndpoint,
                    data: './test/data/',
                    reports: './test/reports/'},
                newmanOptions: {reporters: 'htmlfull', timeoutRequest: 100}
            });

            let results = await runner.runTests();
            expect(results.length).equals(12);
            await cleanTestDirectory();
        })
    })
})    