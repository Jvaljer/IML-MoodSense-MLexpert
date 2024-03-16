import '@marcellejs/core/dist/marcelle.css';
import * as m from '@marcellejs/core';
import { moodReviewer } from './components';

//-------------------------------------------//
//          Marcelle Base Components         //
//-------------------------------------------//
const input = m.webcam();
const pad = m.text('<div class="pad"></div>');

const capture = m.button('Capture your mood');
const txt0 = m.text('<div class="mtext">If you are satisfied with the captured picture, go onto the next page !</div>');


const shadow_src = m.imageUpload({ width:224, height:224 });
const display0 = m.imageDisplay(shadow_src.$images);

const src = m.imageUpload({ width:224, height:224 });
const display1 = m.imageDisplay(src.$images);

const load = m.button('Load Captured Mood & Model prediction');

const reviewer = moodReviewer();

//--------------------------------------------//
//          Intern Variables & Methods        //
//--------------------------------------------//
var mood;
var mood_inst;

//------------------------------------------//
//          Data Storage & Handling         //
//------------------------------------------//
const store = m.dataStore(
	'https://marcelle.lisn.upsaclay.fr/iml2024/api'
  );
try {
	await store.connect();
} catch (error) {
	await store.loginWithUI();
}
const extractor = m.mobileNet();

const trainset = m.dataset('project-images', store);
const tmp_set = m.dataset('temporary', store);

const browser = m.datasetBrowser(tmp_set);
browser.title = 'Recorded Moods'

//-------------------------------------------//
//          Classifier & Predictions         //
//-------------------------------------------//
const clf = m.mlpClassifier({ 
    layers: [128, 64, 64, 32], 
    epochs: 15, 
    batchSize: 32
});

const batch = m.batchPrediction("patient-batch", store);

const $feature = src.$images
	.map((img) => extractor.process(img))
	.awaitPromises();
const $prediction = $feature
	.map((feat) => clf.predict(feat))
	.awaitPromises();

const plot = m.confidencePlot($prediction);

//-----------------------------------//
//          Streams Handling         //
//-----------------------------------//
capture.$click.subscribe(async() => {
	if(input.$images.get()!=undefined){
		//now we wanna move on with that one (tolerating multiple selection but not working with it tho)
		mood = input.$images.get();
		var thumb = input.$thumbnails.get();
		shadow_src.$images.set(mood);

		mood_inst = {
			x: await extractor.process(mood),
        	y: 'undefined',
        	thumbnail: thumb,
		}
	}
});

load.$click.subscribe(async() => {
	src.$images.set(mood);
	reviewer.SetInstance(mood_inst);
}); //MOVE THAT TO A CUSTOM COMPONENT TO MAKE BUTTON BETTER ??
//-------------------------------------//
//          Wizard Organisation        //
//-------------------------------------//
const wiz = m.wizard();
wiz
	.page()
	.title('Recording')
	.description('Take a picture of your mood:')
	.use(input, capture, pad, display0, txt0)
	.page()
	.title('Reviewing')
	.description('Review and Correct your mood:')
	.use(load, display1, plot, reviewer);

wiz.$current.subscribe(async(cur) => {
	if(cur == 1){
		/*src.$images.set(mood);
		reviewer.SetInstance(mood_inst);*/
		//must find a way to load automatically here (without having to load manually)
	}
});
//------------------------------------//
//         HTML Doc Handling          //
//------------------------------------//
document.querySelector('#open-wizard').addEventListener('click', () => {
	//here we are gonna handle the setup of classifier and store fetching infos
	wiz.show();
	clf.load(store, 'base-clf');
});

document.querySelector('#open-week-tab').addEventListener('click', () => {
	console.log("open the WEEK tab there");
});

document.querySelector('#open-month-tab').addEventListener('click', () => {
	console.log("open the MONTH tab there");
});