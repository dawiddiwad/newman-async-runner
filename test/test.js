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
        it('should not contain password', function(){
            for (file of reportFiles){
                assert.equal(file.includes('123DuP@321'), false);
            }
        })
        it('should contain *** in place of password', function(){
            for (file of reportFiles){
                assert.equal(file.includes('***'), true);
            }
        })
    })
})