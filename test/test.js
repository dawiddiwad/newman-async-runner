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

})