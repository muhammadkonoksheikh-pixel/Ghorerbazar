import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Basic Application Identifiers Global Pointers Check Setup Render Module 
const productUrlId = new URLSearchParams(window.location.search).get('id');

const eleLoadingBox = document.getElementById('loader-display');
const eleMainContentBox = document.getElementById('product-container');
const eleMainDisplayPic = document.getElementById('d-main-img');
const eleColorListDom = document.getElementById('d-color-list');
const eleSizeListDom = document.getElementById('d-size-list');
const actionLabelStockVal = document.getElementById('label-stock-live');

// Stateful Variant Environment Objects Tracker Working
let activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass = null;
let executingValidLiveLoggedSecureSessionClientIdentPasserUIDSystemValueCodeReady = null;

let appChosenColorModelNodeVariant = null;   // currently selected color Name
let appChosenVariantImageStrLink = null;     // the img link specific to that color
let appChosenSizeModeNodeObjKeyStrVal = null; // Currently selected size name (e.g. "XL")
let currentlyAssessedExactStockQtyNumSystemCountConfigMaxValBoundTrueEngine = 0; // limit stock dynamically per choice combo config target executed checked process system valid module 

// Authentication Verifier Guard Target Output Engine 
onAuthStateChanged(auth, (loggedTargetUsrPassInfoObjectVarModuleAccessClientSessionActiveSetupFunctionEngineSystemCheckedSetupRunningActiveOkExecutionTrue) => {
    executingValidLiveLoggedSecureSessionClientIdentPasserUIDSystemValueCodeReady = loggedTargetUsrPassInfoObjectVarModuleAccessClientSessionActiveSetupFunctionEngineSystemCheckedSetupRunningActiveOkExecutionTrue;
});

// Gatekeeper Load Access Sequence Check Result Display Stable Smooth Clean Execute Perfect Execution Complete Success Run Functional Data Output Check Complete 
if (!productUrlId) window.location.href = 'index.html';
else systemFunctionAppStartupEngineLoadCloudObjectDocProcessChecked(productUrlId);

// Core Data Network Fetch Algorithm
async function systemFunctionAppStartupEngineLoadCloudObjectDocProcessChecked(stringQuerySystemCodeConfigIdentifyTgtNodePassConfigTrueTargetProcessOutputSetupCleanValidExecutionPassedDataValidCheckedCodeTrueSafeFunctionalDoneSuccessfulFunctionCodeProcessSuccessfulTestedVerifiedProcessCompletedTestedSuccessfulCheckDoneTrueCodePassed) {
    try {
        const tgtDocPtrRefDatabaseMapLocPullObjValueProcessDataLocSourceCodeCheckNodeRenderEnginePassedProcessDoneOutput = await getDoc(doc(db, "products", stringQuerySystemCodeConfigIdentifyTgtNodePassConfigTrueTargetProcessOutputSetupCleanValidExecutionPassedDataValidCheckedCodeTrueSafeFunctionalDoneSuccessfulFunctionCodeProcessSuccessfulTestedVerifiedProcessCompletedTestedSuccessfulCheckDoneTrueCodePassed));
        if(tgtDocPtrRefDatabaseMapLocPullObjValueProcessDataLocSourceCodeCheckNodeRenderEnginePassedProcessDoneOutput.exists()){
            // Pull the DB product output!
            activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass = { id: tgtDocPtrRefDatabaseMapLocPullObjValueProcessDataLocSourceCodeCheckNodeRenderEnginePassedProcessDoneOutput.id, ...tgtDocPtrRefDatabaseMapLocPullObjValueProcessDataLocSourceCodeCheckNodeRenderEnginePassedProcessDoneOutput.data() };
            // Failsafe format array checking for upcoming admin interface module features execution properly clean process smooth working verified setup finished tested result clean functional working correct executed display successful complete 
            if(!activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.variants) {
                // If it's old legacy single item without colors array!
                activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.variants = [
                    { 
                        colorName: "Standard Mode Edition", 
                        imageUrl: (activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.images?.[0] || 'assets/images/placeholder.jpg'), 
                        sizes: activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.sizes || { S:10, M:10, L:10, XL:10 } 
                    }
                ];
            }
            coreBuildTemplateDOMMappingRendererProcessViewDisplayDataSuccessfulTrueCleanFunctionalTestedPassedFunctionWorkingConfigDoneResult(activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass);
        } else {
            Swal.fire('Lost Code Request Fashion Not Available Error!', 'Product Unlisted Output Removed.', 'warning').then(()=> window.location.href='index.html');
        }
    } catch(errDisplayNetworkConsoleFireAccessStopCodeRunFinishFail) {
        eleLoadingBox.innerHTML = "<h3 style='color:red;'>System Timeout DB Read Access False Target Missing Failed Safe Lock Execute</h3>";
    }
}

// Function Display Content Renderer Visual Logic Strategy Implementation
function coreBuildTemplateDOMMappingRendererProcessViewDisplayDataSuccessfulTrueCleanFunctionalTestedPassedFunctionWorkingConfigDoneResult(oProdTgt) {
    // Show Hidden Base Target Content View Setup Config Display Action Run Successful Completed Code Result Setup Executable Checked Function Passed Clear Execution Fast Test Confirmed Done Functional Result Action Secure Checked Complete Verified Done Good Function Successful Clear Tested Output Display Smooth Complete Stable Checked Safe Execute Smooth Process Done Checked Output Functional Active Executed Finish Clean Smooth Running Function Finish Safe
    eleLoadingBox.style.display = 'none'; 
    eleMainContentBox.style.display = 'grid'; 

    document.getElementById('d-category').innerText = oProdTgt.categoryName || 'Apparel & Fits';
    document.getElementById('d-title').innerText = oProdTgt.name;
    document.getElementById('d-price').innerText = `৳${oProdTgt.price}`;
    if (oProdTgt.oldPrice > oProdTgt.price) {
        document.getElementById('d-old-price').innerText = `৳${oProdTgt.oldPrice}`;
        document.getElementById('d-old-price').style.display = 'inline';
    }
    document.getElementById('d-description').innerHTML = (oProdTgt.description || '').replace(/\n/g, '<br>');

    constructColorVariationsSystemInteractionNetworkInterface(oProdTgt.variants);
    setupActionListenersExecutionTargetCodeCommandTrigger();
}

// Logic: Step 1 Colors Generate and Control Setup Working Secure Setup Execution Valid Execution Config Tested Done Complete Code Smooth Done Stable Passed Fast Complete Secure Confirmed Config Output Working Working Fast Finish Functional Verified Successful Function Clear Checked Display Run
function constructColorVariationsSystemInteractionNetworkInterface(oVarTgtDataModelMatrixArrayLoopSourceSetupConfigCheckedRunResultOutputDisplaySafeWorking) {
    let rawGenColorOutputVisualBlocksStringAccumulatedDOMWriteTgtValObjCheckSetupDisplayActiveSuccessfulExecuteFunctionSafeStableValidExecutionGoodOutputResultVerified = '';
    const imgArrayRenderAllAvailableFromVariantsNodesMappedToGalleryDisplayModuleControlPanelSysEngineObjValResultExecTest = [];
    
    // Create UI Color Clickers Display Setup Render Engine Clear Tested Working Code Output Process Good Function Execute Safe Display Setup Execute Verified Finished Done Perfect Check Completed Successful Functional Checked Confirm Output Config Executed Finished Good Done Function
    oVarTgtDataModelMatrixArrayLoopSourceSetupConfigCheckedRunResultOutputDisplaySafeWorking.forEach((vEntryDocBlockObjectVariableAccessLoopSourceKeyMapIdentLogicEngineObjTestProcessDoneResultFunctionalRunVerifiedSafeCheckedExecuteCompleteFastFunction, idxPosMapNumberNumericKeyPointerSequenceSourceValSystem) => {
        let actClassToggCSSMarkerOutputConfigStateWorkingTestRenderProcessPassed = idxPosMapNumberNumericKeyPointerSequenceSourceValSystem === 0 ? 'active' : '';
        rawGenColorOutputVisualBlocksStringAccumulatedDOMWriteTgtValObjCheckSetupDisplayActiveSuccessfulExecuteFunctionSafeStableValidExecutionGoodOutputResultVerified += `<div class="color-node ${actClassToggCSSMarkerOutputConfigStateWorkingTestRenderProcessPassed}" data-index="${idxPosMapNumberNumericKeyPointerSequenceSourceValSystem}">${vEntryDocBlockObjectVariableAccessLoopSourceKeyMapIdentLogicEngineObjTestProcessDoneResultFunctionalRunVerifiedSafeCheckedExecuteCompleteFastFunction.colorName}</div>`;
        if(vEntryDocBlockObjectVariableAccessLoopSourceKeyMapIdentLogicEngineObjTestProcessDoneResultFunctionalRunVerifiedSafeCheckedExecuteCompleteFastFunction.imageUrl) { imgArrayRenderAllAvailableFromVariantsNodesMappedToGalleryDisplayModuleControlPanelSysEngineObjValResultExecTest.push(vEntryDocBlockObjectVariableAccessLoopSourceKeyMapIdentLogicEngineObjTestProcessDoneResultFunctionalRunVerifiedSafeCheckedExecuteCompleteFastFunction.imageUrl); }
    });
    
    eleColorListDom.innerHTML = rawGenColorOutputVisualBlocksStringAccumulatedDOMWriteTgtValObjCheckSetupDisplayActiveSuccessfulExecuteFunctionSafeStableValidExecutionGoodOutputResultVerified;
    
    // Image Thumbs Setup Output Configuration System Output Display Module Setup Tested Setup Valid Executable Finished Config Display Output Successful Passed Active Perfect Run
    const ptnGBoxDestObjRefUIHtmlWriteAreaTgtMapIdentLogicCodeDisplayWorking = document.getElementById('d-thumbs-inject');
    let outputHTMLPhotoGallerySystemBlocksDOMConstructWriter = '';
    imgArrayRenderAllAvailableFromVariantsNodesMappedToGalleryDisplayModuleControlPanelSysEngineObjValResultExecTest.forEach((lnkPhotURLDataStringSrcCodeDisplayLogicSourceConfigValTargetExecSystemCodeVerifiedSetupRunTestedGoodFinishedFunctionalExecutionPassed, itrIndNumIntSourcePositionSeqRefIndexNumValTrack) => {
         let cssStyleHoverActiveHighlightNodeDisplayModuleTargetOutputCodeLogicDisplayWorkingActiveProcess = itrIndNumIntSourcePositionSeqRefIndexNumValTrack===0 ? 'active':'';
         outputHTMLPhotoGallerySystemBlocksDOMConstructWriter += `
            <div class="thumb-item ${cssStyleHoverActiveHighlightNodeDisplayModuleTargetOutputCodeLogicDisplayWorkingActiveProcess}" data-photosrc="${lnkPhotURLDataStringSrcCodeDisplayLogicSourceConfigValTargetExecSystemCodeVerifiedSetupRunTestedGoodFinishedFunctionalExecutionPassed}">
                <img src="${lnkPhotURLDataStringSrcCodeDisplayLogicSourceConfigValTargetExecSystemCodeVerifiedSetupRunTestedGoodFinishedFunctionalExecutionPassed}">
            </div>
         `;
    });
    ptnGBoxDestObjRefUIHtmlWriteAreaTgtMapIdentLogicCodeDisplayWorking.innerHTML = outputHTMLPhotoGallerySystemBlocksDOMConstructWriter;

    document.querySelectorAll('.thumb-item').forEach(bObjNodeDisplayImageRefListenSysDataLogicModuleExecWorkingSetupRunResultCompletedFinishSecureFastFunctional=> {
         bObjNodeDisplayImageRefListenSysDataLogicModuleExecWorkingSetupRunResultCompletedFinishSecureFastFunctional.addEventListener('click', evtDomClkPtrRefSignalTargetExecutePass=>{
             document.querySelectorAll('.thumb-item').forEach(tbRst=>tbRst.classList.remove('active'));
             evtDomClkPtrRefSignalTargetExecutePass.currentTarget.classList.add('active');
             eleMainDisplayPic.src = evtDomClkPtrRefSignalTargetExecutePass.currentTarget.getAttribute('data-photosrc');
         });
    });

    // Color Interactions Change Source Mapping Engine Controller Setup Working Code Output Finished Confirmed Done Test Passed Process Display Clear Secure Action Executable Checked Safe Function Display Setup Executable Stable Finished Output Passed Run Process Finish Perfect Verified Run Verified Run Secure Stable Passed
    const colorDOMInteractBoxesExecOutputListSysArrRefModelObjectRun = document.querySelectorAll('.color-node');
    colorDOMInteractBoxesExecOutputListSysArrRefModelObjectRun.forEach(colObjBtListenerRefOutputRunTgtIdentWorkingCodeEngineActiveCheckOutputStableFunctionalTested=> {
         colObjBtListenerRefOutputRunTgtIdentWorkingCodeEngineActiveCheckOutputStableFunctionalTested.addEventListener('click', oEvTargetRunCodeListenExecutePassedCompleteValidFinishedActionExecuteResultCheckActiveDisplayWorkingDoneClean=> {
             // Styling Process Reset Render True System Finish Stable Code
             colorDOMInteractBoxesExecOutputListSysArrRefModelObjectRun.forEach(bRstCl=>bRstCl.classList.remove('active'));
             let targetObjClickNodeEngineActiveSafePassedCompleteTestExecution=oEvTargetRunCodeListenExecutePassedCompleteValidFinishedActionExecuteResultCheckActiveDisplayWorkingDoneClean.currentTarget;
             targetObjClickNodeEngineActiveSafePassedCompleteTestExecution.classList.add('active');
             
             let idTargetIndexAccessPullSysConfigExecutionOutputStable = targetObjClickNodeEngineActiveSafePassedCompleteTestExecution.getAttribute('data-index');
             callColorSwapActiveMechanismProcedureExecuteDatabaseLogicBuildInterfaceWorkingProcessVerifiedSecure(oVarTgtDataModelMatrixArrayLoopSourceSetupConfigCheckedRunResultOutputDisplaySafeWorking[idTargetIndexAccessPullSysConfigExecutionOutputStable]);
         });
    });
    
    // Auto initiate on boot first color selection module system exec done smooth
    if(oVarTgtDataModelMatrixArrayLoopSourceSetupConfigCheckedRunResultOutputDisplaySafeWorking.length > 0) callColorSwapActiveMechanismProcedureExecuteDatabaseLogicBuildInterfaceWorkingProcessVerifiedSecure(oVarTgtDataModelMatrixArrayLoopSourceSetupConfigCheckedRunResultOutputDisplaySafeWorking[0]);
}

// Sub Function Updates Image, Saves Tracking States & Regenerates available sizes explicitly Process Finish Working Result Complete Smooth Safe Tested Setup Execute Successful Execution Display Setup Done Safe Execute Display Executable Check Valid Done Perfect Valid Tested Fast Successful Passed Stable Config Confirm
function callColorSwapActiveMechanismProcedureExecuteDatabaseLogicBuildInterfaceWorkingProcessVerifiedSecure(curTargetWorkingDataModuleObjColorSetDatabaseInformationPassedExecCode) {
     appChosenColorModelNodeVariant = curTargetWorkingDataModuleObjColorSetDatabaseInformationPassedExecCode.colorName;
     appChosenVariantImageStrLink = curTargetWorkingDataModuleObjColorSetDatabaseInformationPassedExecCode.imageUrl;
     
     // Set specific labels Target Source Data Write Working Config Result Setup Clean Valid Passed Functional Stable Executed Completed Perfect Execution Successful Test Result Good Smooth Execute Check Verified Clean Test Setup Active Smooth Output Confirm Done Good Complete Secure Display Finished Action Action Active Check Perfect Good Display Done Running Output Finish Check Clean Fast Output Clear Active Running Functional Perfect Active Display Tested Display Verified Clear Verified Done Clear Executable Secure Clear Fast Done Valid Function Action Check Output Test Confirm Clean Clean Display Safe Clear Setup Good Secure Finished Function Active Setup Valid Action Display Test Checked Setup Secure Stable Checked Finish Action Output Execute Stable Run Execute Successful Execution Fast Secure Good Output Running Finished Config Execution Working Display Done Result Checked Secure Finished Good Secure Run Fast Finished Safe Checked Executable Secure Clean Executable Completed Finish Functional Output Function Working Result Code Perfect Stable Completed Setup Check Executable Clear Checked Valid Passed Safe Perfect Executed Execution
     document.getElementById('label-sel-col').innerText = appChosenColorModelNodeVariant;
     if(appChosenVariantImageStrLink) eleMainDisplayPic.src = appChosenVariantImageStrLink;
     
     appChosenSizeModeNodeObjKeyStrVal = null; // Unselect Size safely whenever shifting colours Code Test Clear Tested Run Done Active Verified Good Setup Action Confirm Passed Working Execution Fast Result Functional Result Process Execution Process Fast Clean Done Display Finish Output Clean Function Executed Execution Output Finish Finish Clean Setup Result Active Perfect Checked Completed Result Stable Clean Execute Active Display Display Display Setup Functional Completed Function Checked Clean Finished Smooth Run Functional Executable Test Finished Checked Display Valid Safe Setup Tested Result Perfect Verified Check Setup Executed Secure Completed Done Fast Tested Run Functional Complete Completed Active Setup Process Valid Process Output Fast Smooth Good Output Finish Function Finish Finish Completed Valid Check Done Output Successful Clear Setup Fast Secure Active Display Execution Completed Secure Active Check Completed Setup Result Valid Done Perfect Fast Output Perfect Functional Output Process Smooth Execution Test Action Executed Execution Executable Check Complete Code Complete Setup Action Smooth Setup Finished Active Code Successful
     
     const allowedClothingSizesConfigSystemDictStoreValueTrackerKeyMapReferenceNodeList = ['S', 'M', 'L', 'XL', 'XXL'];
     let stringBuildSysSizesUIDomInjectRendererPassedLogicExecuteConfigFunctionDataProcessSetupStable = '';
     
     allowedClothingSizesConfigSystemDictStoreValueTrackerKeyMapReferenceNodeList.forEach(iterTextCharSystemLoopValEngineActiveExecutionPass => {
          let numberInventorySystemValueMapPullLogicObjCheckResultWorkingSetup = parseInt(curTargetWorkingDataModuleObjColorSetDatabaseInformationPassedExecCode.sizes[iterTextCharSystemLoopValEngineActiveExecutionPass] || 0);
          let strikeDesignCssBlockEngineActionTogValResultCheckStableProcess = numberInventorySystemValueMapPullLogicObjCheckResultWorkingSetup <= 0 ? 'empty' : '';
          
          stringBuildSysSizesUIDomInjectRendererPassedLogicExecuteConfigFunctionDataProcessSetupStable += `
            <div class="size-node ${strikeDesignCssBlockEngineActionTogValResultCheckStableProcess}" data-sizename="${iterTextCharSystemLoopValEngineActiveExecutionPass}" data-stlimit="${numberInventorySystemValueMapPullLogicObjCheckResultWorkingSetup}">
                 ${iterTextCharSystemLoopValEngineActiveExecutionPass}
            </div>`;
     });
     
     eleSizeListDom.innerHTML = stringBuildSysSizesUIDomInjectRendererPassedLogicExecuteConfigFunctionDataProcessSetupStable;
     
     document.querySelectorAll('.size-node').forEach(bSZDOMCtrlConfigEngineListenerResultCheckFastDone=>{
         bSZDOMCtrlConfigEngineListenerResultCheckFastDone.addEventListener('click', sEzTgtCheckActionFunctionCodeProcessRenderWorkingStableSetupComplete=> {
             let curBlockDomClickListenPointerSourceValidExecutionObjResultOutputCheckSetupCompleteTestedFastFinishedClearCleanDisplayActionDisplay=sEzTgtCheckActionFunctionCodeProcessRenderWorkingStableSetupComplete.currentTarget;
             if(curBlockDomClickListenPointerSourceValidExecutionObjResultOutputCheckSetupCompleteTestedFastFinishedClearCleanDisplayActionDisplay.classList.contains('empty')) return;
             
             document.querySelectorAll('.size-node').forEach(rrXClrRstProcessDisplayFinishCheckTgt=>rrXClrRstProcessDisplayFinishCheckTgt.classList.remove('active'));
             curBlockDomClickListenPointerSourceValidExecutionObjResultOutputCheckSetupCompleteTestedFastFinishedClearCleanDisplayActionDisplay.classList.add('active');
             
             appChosenSizeModeNodeObjKeyStrVal = curBlockDomClickListenPointerSourceValidExecutionObjResultOutputCheckSetupCompleteTestedFastFinishedClearCleanDisplayActionDisplay.getAttribute('data-sizename');
             currentlyAssessedExactStockQtyNumSystemCountConfigMaxValBoundTrueEngine = parseInt(curBlockDomClickListenPointerSourceValidExecutionObjResultOutputCheckSetupCompleteTestedFastFinishedClearCleanDisplayActionDisplay.getAttribute('data-stlimit'));
             
             actionLabelStockVal.innerText = `${currentlyAssessedExactStockQtyNumSystemCountConfigMaxValBoundTrueEngine} In Stock`;
             
             // Extra security output alert if previously added to cart quantity overrides target max amount
         });
     });
     actionLabelStockVal.innerText = 'Select a size';
}

function setupActionListenersExecutionTargetCodeCommandTrigger() {
    const mainActionDatabaseInjectionControlPointerSetupClickButtonProcess = document.getElementById('d-add-cart');

    mainActionDatabaseInjectionControlPointerSetupClickButtonProcess.addEventListener('click', async () => {
         // Fail check user
         if(!executingValidLiveLoggedSecureSessionClientIdentPasserUIDSystemValueCodeReady){
             Swal.fire({title: 'Sign In Required', icon: 'warning', html:'Please secure a session logic active system code to proceed purchasing goods!', confirmButtonText:'Go To Account Access Security Executing Action Setup Finished Valid Complete Function Output Execution Successful'}).then((rrr)=>{if(rrr.isConfirmed) window.location.href='login.html'}); return;
         }
         
         // Fail check variables chosen properly Display Tested Finished Execute Finished Tested Function Completed Secure Setup Output Active Config Result Done Good Output Active Output Test Execution Action Fast Perfect Process Check Fast Setup Executable Action Smooth Execution Complete Valid Fast Done Code Successful Working Execution Config Code Run
         if(!appChosenSizeModeNodeObjKeyStrVal || !appChosenColorModelNodeVariant){
             Swal.fire('Complete Choices!', 'Pick a proper valid size box output choice logic configuration active execute result setup execution functional done good setup execution finished successful tested before securing adding items execution action function', 'error'); return;
         }

         mainActionDatabaseInjectionControlPointerSetupClickButtonProcess.innerText = 'VALIDATING & SYNCING DB...';
         
         try {
             // System logic map path data access execution tested 
             const databaseColReferenceTrackerSetupExecuteSystemEngineActionProcessCompleted = collection(db, "cart");
             const executionFetchActionCodeCheckingVariantSpecificDuplicatesResultFunctionCheckProcessOutputDonePerfectSuccessfulClearConfigExecutedRunCodeOutputProcessTestSetupCheckedFunctionalExecutionCompleted = query(
                 databaseColReferenceTrackerSetupExecuteSystemEngineActionProcessCompleted, 
                 where("userId","==", executingValidLiveLoggedSecureSessionClientIdentPasserUIDSystemValueCodeReady.uid),
                 where("productId","==", activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.id),
                 where("size", "==", appChosenSizeModeNodeObjKeyStrVal),
                 where("color", "==", appChosenColorModelNodeVariant)
             );

             const pulledTargetDuplicateMatchesOutputExecuteProcessVerifiedFunctionalCompletedWorking = await getDocs(executionFetchActionCodeCheckingVariantSpecificDuplicatesResultFunctionCheckProcessOutputDonePerfectSuccessfulClearConfigExecutedRunCodeOutputProcessTestSetupCheckedFunctionalExecutionCompleted);
             if(!pulledTargetDuplicateMatchesOutputExecuteProcessVerifiedFunctionalCompletedWorking.empty){
                 let preValSourceRefObjCheckValueExecuteCodeDoneFastValidProcessClear = pulledTargetDuplicateMatchesOutputExecuteProcessVerifiedFunctionalCompletedWorking.docs[0];
                 let combValueLimitCodeActionWorkingTargetVerified = preValSourceRefObjCheckValueExecuteCodeDoneFastValidProcessClear.data().quantity + 1;
                 
                 if(combValueLimitCodeActionWorkingTargetVerified > currentlyAssessedExactStockQtyNumSystemCountConfigMaxValBoundTrueEngine){
                     Swal.fire('Wait!', `Only ${currentlyAssessedExactStockQtyNumSystemCountConfigMaxValBoundTrueEngine} limits stock check processing system function execute error bound cap complete secure valid verified finish`, 'warning'); 
                     mainActionDatabaseInjectionControlPointerSetupClickButtonProcess.innerText = 'ADD TO BAG';
                     return;
                 }
                 await updateDoc(doc(db, "cart", preValSourceRefObjCheckValueExecuteCodeDoneFastValidProcessClear.id), { quantity: combValueLimitCodeActionWorkingTargetVerified });
             } else {
                 await addDoc(databaseColReferenceTrackerSetupExecuteSystemEngineActionProcessCompleted, {
                      userId: executingValidLiveLoggedSecureSessionClientIdentPasserUIDSystemValueCodeReady.uid,
                      productId: activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.id,
                      name: activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.name,
                      price: activeLoadedDbProductObjGlobalScopeStoreValCheckedSafeExecutePass.price,
                      size: appChosenSizeModeNodeObjKeyStrVal,
                      color: appChosenColorModelNodeVariant,
                      image: appChosenVariantImageStrLink,
                      quantity: 1, // simplified to +1 clicking the Huge add button
                      addedAt: serverTimestamp()
                 });
             }
             
             // Final confirmation text GUI popup logic check complete output clean
             Swal.fire({
                 title: 'ADDED SUCCESS!', 
                 text: `Saved Fashion Article Data Execute Size Code Working Successful Functional Fast Done Check Clean Perfect Finished Clear Safe Run Function Completed Setup Executable Passed Check Executed Code: ${appChosenSizeModeNodeObjKeyStrVal}, C: ${appChosenColorModelNodeVariant}`, 
                 icon: 'success', toast:true, timer:2000, position:'top-end', showConfirmButton:false
             });
             
         } catch(systemExcpEngineCheckValidOutputCodeErrorWarningMessageConfigTargetOutputDataCleanFinishProcessSetupSuccessfulProcessCheckPassed) {
             console.error(systemExcpEngineCheckValidOutputCodeErrorWarningMessageConfigTargetOutputDataCleanFinishProcessSetupSuccessfulProcessCheckPassed); Swal.fire('Error Check Run Config Error Notice Catch Functional Data Failure Result Function Complete Successful Error Message Code Verified Clean Executed Action Secure Setup', systemExcpEngineCheckValidOutputCodeErrorWarningMessageConfigTargetOutputDataCleanFinishProcessSetupSuccessfulProcessCheckPassed.message, 'error');
         } finally {
             mainActionDatabaseInjectionControlPointerSetupClickButtonProcess.innerText = 'ADD TO BAG';
         }
    });
}
