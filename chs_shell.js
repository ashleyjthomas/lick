/* =============================================================
   LICK-4 — CHS SHELL
   =============================================================
   Deploy THIS file to Children Helping Science when you want the
   hybrid setup (webcam recording on CHS, game on GitHub Pages),
   mirroring RELKIND:

     CHS tab                          game tab
     -------                          --------
     fullscreen
     video config + consent
     start recording   ------>
     parent instructions
     opens game  ------------------>  index.html?pid=...&chsid=...
     waits for GAME_COMPLETE <-----   postMessage on finish
     stop recording
     payment email
     exit survey
     debrief

   The webcam records the child throughout, because recording runs
   in THIS tab while the child plays in the other one. Trial data
   goes to the Google Sheet from the game tab (see index.html).

   The alternative is experiment.js, which runs the entire study
   inside CHS with no Google Sheet. Use one or the other, not both.

   IMPORTANT — consent text: the procedures/purpose/rights strings
   below match the wording deployed on CHS, which is authoritative.
   One sentence was added to procedures, because it is now true and
   affects recording: the study opens in a second tab and this one
   must stay open. The strings still say recording and data go
   through Lookit, which stops being true once trial data lands in a
   Google Sheet — update them to match the IRB amendment before
   collecting data.
   ============================================================= */

const jsPsych = initJsPsych();
const timeline = [];

// === PARTICIPANT / CONDITION TAG ===============================
// Same scheme as RELKIND: a condition tag plus a timestamp, so the
// Google Sheet row can be matched back to the CHS response.
const CONDITION_TAGS = Array.from({ length: 100 },
    (_, i) => "LK" + String(i + 1).padStart(3, "0"));

const assigned_condition =
    jsPsych.randomization.sampleWithoutReplacement(CONDITION_TAGS, 1)[0]
    + "_" + Date.now();

// Where the game lives. Must be the GitHub Pages URL, not a local path.
const GAME_URL = "https://ashleyjthomas.github.io/lick/";

// === FULLSCREEN ================================================
const enter_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    button_label: "Go full screen"
};

// === VIDEO CONFIG + CONSENT ====================================
const video_config = { type: chsRecord.VideoConfigPlugin };

const video_consent = {
    type: chsRecord.VideoConsentPlugin,
    PIName: "Ashley Thomas",
    institution: "Harvard University",
    PIContact: "athomas@g.harvard.edu",
    payment: "You will receive a $5 gift card for completing this study. You will be asked to provide your email for this purpose. Your email will remain strictly confidential and will only be used to issue payment.",
    procedures: "The following is key information about the study: Someone will explain this asynchronous research study to you in the form of a video or summary. Your participation is completely voluntary; you and your child can choose not to take part. You and your child can agree to take part and later change your mind. However, because this is an asynchronous online study, we schedule 30–45-minute sessions to ensure there is ample time to make sure that your webcam is set up and working properly. The study session will be conducted remotely and recorded through Lookit, an online platform for developmental research studies. During the study, your child will be observed and recorded for data collection purposes only. The study itself opens in a second browser tab; please keep this tab open, as recording happens here. During the study, your child will be presented with short videos, pictures, and recorded narration showing girls and their moms or teachers playing musical instruments. We will ask your child a series of questions about whether the characters' actions were okay, and record your child's verbal answers and clicks on the screen. You may be asked to complete several questionnaires that will help us better understand your child's development and behavior. They are optional, so you may fill out as much as you would like. The information you provide helps us to better understand social and moral development. We don't believe there are any risks for your child from participating in this research. You and your child are free to choose whether to be in this study.  If you do choose to participate, it's okay to stop at any point during the session. There has been no harm to children involved in this study, and there are no risks associated with their participation. We cannot promise any benefits to your child due to their participation in the study. However, we hope that your child will enjoy the study, and your child's participation may improve our understanding of certain phenomena in the field of Developmental Psychology, as this study attempts to provide deeper insight into how children think about consent and relationships. Participation in research is completely voluntary. Your child's alternative to participating in this research study is to not participate. Your child can decide to participate, not participate, or discontinue participation at any time without penalty or loss of benefits to which your child is otherwise entitled. You and your child's decision will not be held against you. You and your child's refusal to participate will not result in any consequences.",
    purpose: "Why is my child being invited to take part in a research study? We invite your child to take part in a research study because this study examines how typically developing children in their age range think about consent and social relationships. In particular, we are interested in how children evaluate actions involving someone else's belongings, especially when those actions occur with or without the other person's knowledge, and whether children's evaluations depend on the relationship between the people involved (e.g., a parent and child versus a teacher and student).",
    research_rights_statement: "You are not waiving any legal claims, rights, or remedies because of your participation in this research study. If you have questions, concerns, or complaints, or think the research has hurt your child, talk to the research team at 617-384-7777. You can also contact the PI, Ashley Thomas, athomas@g.harvard.edu. This research has been reviewed and approved by the Harvard University Area Institutional Review Board (\"IRB\"). You may talk to them at (617) 496-2847 or cuhs@harvard.edu if: <ul><li>Your questions, concerns, or complaints are not being answered by the research team.</li><li>You cannot reach the research team.</li><li>You want to talk to someone besides the research team.</li><li>You have questions about your child's rights as a research subject.</li><li>You want to get information or provide input about this research.</li></ul>"
};

// === PAYMENT EMAIL =============================================
const email_trial = {
    type: jsPsychSurveyText,
    questions: [{
        prompt: "Please enter your email below. This information will be kept strictly confidential and will only be used to issue payment.",
        name: "email",
        required: true
    }],
    on_finish: function(data) {
        jsPsych.data.addProperties({ payment_email: data.response.email });
    },
    data: { name: "email_for_payment" }
};

// === RECORDING =================================================
const start_rec = { type: chsRecord.StartRecordPlugin };
const stop_rec  = { type: chsRecord.StopRecordPlugin };

// === PARENT INSTRUCTIONS =======================================
const instructions_page1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="max-width: 620px; margin: 0 auto; line-height: 1.6; text-align: left;">
            <h2 style="text-align:center;">Important Instructions</h2>
            <!-- Deliberately does not name the two relationship labels. A parent
                 reading this aloud would prime the child before the manipulation
                 check, which asks them to identify who the adult is. -->
            <p>In a moment you'll open a game for your child to play. Your child will
               watch short videos of girls playing musical instruments with a
               grown-up, and will answer a few simple questions after each video.</p>
            <p>We want to know what your child genuinely thinks, so please
               <strong>stay neutral</strong> while they answer, and try to minimise
               distractions.</p>
            <p>It's fine to encourage a decision — <em>"Which one do you want to pick?"</em>
               or <em>"What do you think?"</em> — but please avoid pointing at or
               suggesting a particular answer.</p>
            <p>The game has narration read aloud, so please make sure the device's
               <strong>sound is on</strong>, and that you have a
               <strong>strong internet connection</strong>.</p>
        </div>`,
    choices: ["Next"],
    data: { name: "instructions_page1" }
};

const instructions_page2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="max-width: 620px; margin: 0 auto; line-height: 1.6; text-align: left;">
            <h2 style="text-align:center;">Before You Start</h2>
            <p>The game opens in a <strong>new tab</strong>. A fox will introduce
               itself and explain the game to your child, so there's no need to
               explain anything yourself.</p>
            <p><strong>Please keep this tab open.</strong> Recording is happening
               here, so closing it will stop the recording.</p>
            <p>The game takes about <strong>15 minutes</strong>. When it finishes,
               this page advances automatically — or you can click
               <strong>Continue</strong> yourself.</p>
            <p>Press <strong>Next</strong> to open the game.</p>
        </div>`,
    choices: ["Next"],
    data: { name: "instructions_page2" }
};

const open_game = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="text-align:center; max-width: 560px; margin: 0 auto;">
            <h2>Open the game</h2>
            <p>Click below to open it in a new tab, then sit with your child while
               they play. Return to this tab when the game is finished.</p>
        </div>`,
    choices: ["Open the game 🦊"],
    on_finish: function() {
        // CHS exposes the response UUID as a URL param; pass it to the game so
        // the Google Sheet row can be joined to the CHS session and video.
        const chsid = new URLSearchParams(window.location.search).get('response_uuid') || '';
        window.open(
            `${GAME_URL}?pid=${encodeURIComponent(assigned_condition)}&chsid=${encodeURIComponent(chsid)}`,
            "_blank"
        );
    },
    data: { name: "open_game", assigned_condition: assigned_condition }
};

// === WAIT FOR THE GAME TO FINISH ===============================
// The game posts {type:'GAME_COMPLETE'} to window.opener when it ends.
// The listener lives in a closure so it can be removed reliably —
// jsPsych may freeze the trial object itself.
const game_complete = (function() {
    let messageHandler = null;
    return {
        type: jsPsychHtmlButtonResponse,
        // Written for the only person who ever actually reads it. While the
        // child plays, this tab sits in the background unread; when the game
        // finishes it posts GAME_COMPLETE and this trial ends itself, so they
        // land on the email screen instead. Anyone looking at this text has
        // therefore come back to this tab early, or the handshake failed.
        stimulus: `
            <div style="text-align:center; max-width: 560px; margin: 0 auto;">
                <h2>Is the game finished?</h2>
                <p style="font-size:19px; line-height:1.55;">
                    If your child is still playing, switch back to the game tab
                    and finish it. <strong>Leave this tab open</strong> — the
                    recording is happening here.
                </p>
                <p style="font-size:19px; line-height:1.55; margin-top:16px;">
                    If the game is already done, click <strong>Continue</strong>.
                </p>
            </div>`,
        choices: ["Continue"],
        on_load: function() {
            messageHandler = function(e) {
                if (e.data && e.data.type === 'GAME_COMPLETE') {
                    jsPsych.data.addProperties({ game_pid: e.data.pid || '' });
                    if (messageHandler) {
                        window.removeEventListener('message', messageHandler);
                        messageHandler = null;
                    }
                    jsPsych.finishTrial();
                }
            };
            window.addEventListener('message', messageHandler);
        },
        on_finish: function() {
            // If the parent clicked Continue first, the listener is still
            // attached — clean it up so it can't fire on a later trial.
            if (messageHandler) {
                window.removeEventListener('message', messageHandler);
                messageHandler = null;
            }
        },
        data: { name: "game_complete", assigned_condition: assigned_condition }
    };
})();

// === EXIT SURVEY + DEBRIEF =====================================
const exit_survey = { type: chsSurvey.ExitSurveyPlugin };

// Debrief text carried over verbatim from the all-in-CHS experiment.js so the
// wording parents see doesn't change with the switch to the hosted game.
const debrief = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<p style="padding: 1em; margin: 0 auto 4% auto; max-width: 950px; border: medium solid #87b79f; border-radius: 5px; background-color: #effbf5; font-size: 26px; line-height: 1.3;">
        Thanks to you and your child for participating in our study!
        <br style="line-height:60px;">
        <b>Description of study:</b> This study examines how children
        ages 6 to 8 think about consent in social relationships. We
        show children short stories about a girl and either her mom
        or her teacher, where the side character interacts with the
        girl's musical instrument in different ways &mdash; sometimes
        with the girl's knowledge, and sometimes while the girl is
        away. We ask children whether each action was &ldquo;okay&rdquo;,
        and what the girl herself would think if she found out. We
        randomize the order of trials and the assignment of
        protagonists to conditions across children. We are interested
        in whether children's evaluations of actions depend on whether
        the action was consensual, what kind of action it was, and the
        relationship between the people involved.
        <br style="line-height:60px;">
        <b>Payment:</b> we will send you a $5 Amazon gift code using the
        email you provided. This can take up to two weeks, but if you
        have not received one by then, please let us know.
        </p>`,
    // A final button has to exist: clicking it ends the jsPsych timeline, which
    // is how CHS learns the session is complete. Labelled "Finish" and left at
    // normal size, matching RELKIND — the old oversized "Submit" read as a
    // second submission step on top of the one CHS provides.
    choices: ["Finish"],
    data: { name: "debrief" }
};

// === TIMELINE ==================================================
// Email is collected after the game rather than up front, matching the order
// in experiment.js. Trade-off worth knowing: a family who abandons midway
// leaves no address for the gift card.
timeline.push(
    enter_fullscreen,
    video_config,
    video_consent,
    start_rec,
    instructions_page1,
    instructions_page2,
    open_game,
    game_complete,
    stop_rec,
    email_trial,
    exit_survey,
    debrief
);

jsPsych.run(timeline);
