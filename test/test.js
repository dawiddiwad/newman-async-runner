let assert = require('assert');
let ziom = require('../newman-async-runner');

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

describe('NewmanRunner()',  function(){
    describe('#setupFolders()',  function(){
        it('should contain folders: ' + JSON.stringify(runnerOptions.folders), async function(){
            await new ziom.NewmanRunner(runnerOptions).setupFolders();
            for (let folder in runnerOptions.folders){
                let directory = await fs.readdirSync('./test/');
                assert(directory.includes(folder));
                await fs.rmdirSync(runnerOptions.folders[folder]);
            }
        });
    })
    describe('#getCollections()', function(){
        it('should generate collections', async function(){
            await fs.mkdirSync(runnerOptions.folders.collections, {recursive: true});
            await fs.copyFileSync('./test/testdata/collections/yolo.postman_collection.json', './test/collections/yolo.postman_collection.json');

            console.log(await fs.readdirSync('./test/collections'));
            let collectionObjects = await new ziom.NewmanRunner(runnerOptions).getCollections();

            assert(collectionObjects[0].address === './test/collections/yolo.postman_collection.json');
            assert(collectionObjects[0].name === 'yolo');
            assert(collectionObjects[0].folders.includes('folder1'));
            assert(collectionObjects[0].folders.includes('folder1 Copy'));
            assert(collectionObjects[0].folders.includes('LUZEM'));
            
            await fs.unlinkSync('./test/collections/yolo.postman_collection.json')
            await fs.rmdirSync(runnerOptions.folders.collections);
        })
    })
})