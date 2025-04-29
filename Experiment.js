/* Feedback_Confidence Experiment
 * A jsPsych experiment measuring confidence in orientation matching tasks with manipulated feedback
 */

// Initialize jsPsych with the target element and data saving
const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    on_finish: function() {
      // Display data in browser for debugging
      jsPsych.data.displayData();
      
      // Save data to tab-delimited text file
      saveDataToTxt();
      
      console.log('Experiment completed');
    }
  });
  
  // Function to save data as tab delimited text file
  function saveDataToTxt() {
    // Get only the response trials
    const responseData = jsPsych.data.get().filter({task: 'response'}).values();
    
    // Create header row
    let textContent = "Participant_ID\tAge\tGender\tTrial_Nr\tShape\tCondition\tGrating_Orientation\tResponse_Orientation\tDeviation\tAccuracy\tConfidence\tFeedback\n";
  
    // Add each trial as a row
    responseData.forEach((trial, index) => {
      const trialNumber = index + 1;
      
      // Use trial.shape directly in the output string, no need for separate variables
      
      // Use . as decimal separator and handle potential undefined values
      const feedback = trial.feedback_deviation ? trial.feedback_deviation.toFixed(1) : "NA";
      const gratingOrientation = trial.stimulus_orientation ? trial.stimulus_orientation.toFixed(1) : "NA";
      const responseOrientation = trial.response_orientation ? trial.response_orientation.toFixed(1) : "NA";
      const deviation = trial.actual_deviation ? trial.actual_deviation.toFixed(1) : "NA";
      const accuracy = trial.accuracy ? trial.accuracy.toFixed(3) : "NA";
      
      // Get the corresponding confidence rating for this trial
      const confidenceData = jsPsych.data.get().filter({
        task: 'confidence',
        trial_nr: trial.trial_nr
      }).values()[0];
      
      const confidence = confidenceData && confidenceData.confidence_rating !== undefined 
        ? confidenceData.confidence_rating 
        : "NA";
      
      textContent += `${participant_id}\t${participant_age}\t${participant_gender}\t${trialNumber}\t${trial.shape}\t${trial.condition}\t${gratingOrientation}\t${responseOrientation}\t${deviation}\t${accuracy}\t${confidence}\t${feedback}\n`;
    });
    
    // Create a Blob and download
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const filename = `orientation_experiment_${participant_id}.txt`;
    
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }
  
  
  // Experiment parameters
  const NUM_TRIALS_PER_SHAPE = 30; // Reduced for testing, increase for real experiment
  const SHAPES = ['square', 'circle', 'hexagon'];
  const CARDINAL_DIRECTIONS = [0, 90]; // Cardinal orientations in degrees
  
  // Define shape-feedback conditions (will be mapped to shapes based on participant ID)
  const shapeFeedbackConditions = [
    { shape: null, condition: 'neutral' },
    { shape: null, condition: 'negative' }, // 15 degrees further on 75% of trials
    { shape: null, condition: 'positive' }  // 15 degrees closer on 75% of trials
  ];
  
  // Pattern ID counter for unique SVG patterns
  let patternIdCounter = 0;
  
  // Variable to store participant info
  let participant_id = "unknown";
  let participant_age = "";
  let participant_gender = "";
  let trial_counter = 0;

  let currentTrialInfo = {
    shape: null,
    condition: null,
    stimulus_orientation: null
  };
  // Confidence scale direction (will be determined by participant ID)
  let confidence_scale_direction = 'left_low';
  
  // Participant information collection
  const participant_id_trial = {
    type: jsPsychSurveyText,
    questions: [
      { prompt: "Please enter your participant ID:", name: "participant_id", required: true },
      { prompt: "Please enter your age:", name: "age", required: true },
      { prompt: "Please enter your gender (Female, Male, Other, Rather not say):", name: "gender", required: true }
    ],
    button_label: "Continue",
    on_finish: function(data) {
      // Store the participant info
      participant_id = data.response.participant_id;
      participant_age = data.response.age;
      participant_gender = data.response.gender;
      
      // Add participant ID to all trial data
      jsPsych.data.addProperties({
        participant_id: participant_id,
        age: participant_age,
        gender: participant_gender
      });
      
      // Use participant ID for deterministic randomization
      const participantSeed = participant_id.toString().split('').reduce(
        (acc, char) => acc + char.charCodeAt(0), 0
      );
      
      // Determine shape-condition mapping based on participant ID
      let shapeOrder = [...SHAPES];
      
      // Simple deterministic shuffle based on participant ID
      for (let i = shapeOrder.length - 1; i > 0; i--) {
        const j = (participantSeed + i) % (i + 1);
        [shapeOrder[i], shapeOrder[j]] = [shapeOrder[j], shapeOrder[i]];
      }
      
      // Assign conditions based on shuffled shapes
      shapeFeedbackConditions[0].shape = shapeOrder[0];
      shapeFeedbackConditions[1].shape = shapeOrder[1];
      shapeFeedbackConditions[2].shape = shapeOrder[2];
      
      // Determine confidence scale direction based on participant ID
      confidence_scale_direction = (participantSeed % 2 === 0) ? 'left_low' : 'right_low';
      
      console.log("Participant ID:", participant_id);
      console.log("Age:", participant_age);
      console.log("Gender:", participant_gender);
      console.log("Shape-condition mapping:", shapeFeedbackConditions);
      console.log("Confidence scale direction:", confidence_scale_direction);
    }
  };

  /* Fullscreen */
gotofullscreen = {
  type: jsPsychFullscreen,
  fullscreen_mode: true
}

  
  // Welcome message
  const welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h1 style="font-size: 36px;">Welcome to the Orientation Matching Experiment</h1>
        </p style="font-size: 24px;">Press space to continue.</p>
      </div>
    `,
    choices: [' ']
  };
  
  // Instructions
  const instructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2 style="font-size: 32px;">Instructions</h2>
        <p style="font-size: 24px;">On each trial, you will see a shape (square, circle, or hexagon) with a grating pattern inside it.</p>
        <p style="font-size: 24px;">Please pay close attention to which shapes you see, at the end of the experiment you will be asked which shape you saw the mmost.</p>
        <p style="font-size: 24px;">After viewing the shape, you will see a line that you can rotate.</p>
        <p style="font-size: 24px;">Your task is to rotate the line to match the orientation of the grating you just saw.</p>
        <p style="font-size: 24px;">Use the 'F' key to rotate counterclockwise and the 'J' key to rotate clockwise.</p>
        <p style="font-size: 24px;">After making your adjustment, you will rate your confidence in your response.</p>
        <p style="font-size: 24px;">Finally, you will receive feedback on your performance.</p>
        <p style="font-size: 24px;">Press any key to begin.</p>
      </div>
    `
  };
  
// Define condition info trial for testing
const condition_info_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
        // Create a formatted display of condition-shape mapping
        let display = `
        <div class="instructions">
          <h2 style="font-size: 32px;">Condition Information (Testing Only)</h2>
          <p style="font-size: 24px;">Shape to Condition Mapping:</p>
          <ul style="text-align: left; font-size: 20px; list-style-position: inside; margin: 20px 0;">
      `;

        // Add each condition
        shapeFeedbackConditions.forEach(cond => {
            display += `<li><strong>${cond.shape}</strong>: ${cond.condition} feedback condition</li>`;
        });

        display += `
          </ul>
          <p style="font-size: 20px; margin-top: 20px;">Neutral = accurate feedback</p>
          <p style="font-size: 20px;">Negative = feedback shows 15° worse than actual (on 75% of trials)</p>
          <p style="font-size: 20px;">Positive = feedback shows 15° better than actual (on 75% of trials)</p>
          <p style="font-size: 24px; margin-top: 30px;">Press any key to begin the experiment.</p>
        </div>
      `;

        return display;
    },
    choices: "ALL_KEYS"
};
  
  // Function to create an SVG with a shape containing a grating
  function createGratingStimulus(shape, orientation) {
    const svgSize = 400;
    const shapeSize = 250;
    const patternId = `grating_${patternIdCounter++}`;
    
    // Define SVG for different shapes with gratings
    let shapePath = '';
    if (shape === 'square') {
      shapePath = `<rect x="${svgSize/2 - shapeSize/2}" y="${svgSize/2 - shapeSize/2}" width="${shapeSize}" height="${shapeSize}" fill="url(#${patternId})" class="stimulus-shape" />`;
    } else if (shape === 'circle') {
      shapePath = `<circle cx="${svgSize/2}" cy="${svgSize/2}" r="${shapeSize/2}" fill="url(#${patternId})" class="stimulus-shape" />`;
    } else if (shape === 'hexagon') {
      // Create hexagon points
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = svgSize/2 + (shapeSize/2) * Math.cos(angle);
        const y = svgSize/2 + (shapeSize/2) * Math.sin(angle);
        hexPoints.push(`${x},${y}`);
      }
      shapePath = `<polygon points="${hexPoints.join(' ')}" fill="url(#${patternId})" class="stimulus-shape" />`;
    }
    
    // Create SVG with grating pattern (thicker lines)
    return `
      <svg width="${svgSize}" height="${svgSize}" style="display: block; margin: 0 auto;">
        <defs>
          <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(${orientation})">
            <line x1="0" y1="0" x2="0" y2="20" stroke="black" stroke-width="3" />
            <line x1="10" y1="0" x2="10" y2="20" stroke="black" stroke-width="3" />
          </pattern>
        </defs>
        ${shapePath}
      </svg>
    `;
  }
  
  // Function to create trials with randomized order of shapes
  function createTrials() {
    let allTrialSets = [];
    
    // Create trials for each shape condition
    for (let condIndex = 0; condIndex < shapeFeedbackConditions.length; condIndex++) {
      const shapeCondition = shapeFeedbackConditions[condIndex];
      
      // Create orientations: balanced sample across the range and ensuring cardinal directions
      let orientations = [...CARDINAL_DIRECTIONS]; // Start with cardinal directions
      
      // Add random orientations to fill remaining trials
      while (orientations.length < NUM_TRIALS_PER_SHAPE) {
        orientations.push(Math.floor(Math.random() * 180)); // 0 to 179 degrees
      }
      
      // Ensure we have exactly NUM_TRIALS_PER_SHAPE orientations
      orientations = jsPsych.randomization.shuffle(orientations).slice(0, NUM_TRIALS_PER_SHAPE);
      
      // Create trials for this shape condition
      for (let i = 0; i < orientations.length; i++) {
        const orientation = orientations[i];
        
        // Create a trial set with all components for this orientation/shape
        const trialSet = {
          // 1. Fixation cross
          fixation: {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div class="fixation">+</div>',
            choices: "NO_KEYS",
            trial_duration: 500
          },
          
          // 2. Show shape with grating (1 second)
          stimulus: {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
              return createGratingStimulus(shapeCondition.shape, orientation);
            },
            choices: "NO_KEYS",
            trial_duration: 500,
            data: {
              task: 'stimulus',
              shape: shapeCondition.shape,
              condition: shapeCondition.condition,
              orientation: orientation
            }
          },
          
          // 3. Orientation matching response
          response: {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
              return `
                <div style="text-align: center;">
                  <p style="font-size: 48px; margin-bottom: 30px;">Adjust the line to match the orientation of the grating you just saw.</p>
                  <div style="width: 400px; height: 400px; margin: 0 auto; display: flex; justify-content: center; align-items: center;">
                    <canvas id="response-canvas" width="400" height="400" style="position: absolute;"></canvas>
                  </div>
                  <p style="font-size: 24px; margin-top: 30px;">Press 'F' to rotate counterclockwise and 'J' to rotate clockwise.</p>
                  <p style="font-size: 24px;">Press SPACE when you're satisfied with the orientation.</p>
                </div>
              `;
            },
            choices: [' '],
            data: function() {
                trial_counter++;
                return {
                  task: 'response',
                  trial_nr: trial_counter,
                  shape: shapeCondition.shape,
                  condition: shapeCondition.condition
                }
              },
            on_load: function() {
              try {
                // Get the canvas element
                const canvas = new fabric.Canvas('response-canvas');
                
                // Center of canvas - ensure exact center
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const lineLength = 160;
                
                // Generate random starting angle
                const randomStartAngle = Math.floor(Math.random() * 180);
                
                // Create a line for orientation adjustment with random starting position
                const line = new fabric.Line(
                  [centerX, centerY - lineLength/2, centerX, centerY + lineLength/2], 
                  {
                    stroke: 'black',
                    strokeWidth: 6, // Thicker line
                    originX: 'center',
                    originY: 'center',
                    left: centerX,
                    top: centerY,
                    angle: randomStartAngle,
                    selectable: false
                  }
                );
                
                // Add to canvas
                canvas.add(line);
                canvas.renderAll();
                
                console.log(`Canvas created with dimensions: ${canvas.width}x${canvas.height}`);
                console.log(`Line positioned at center: (${centerX}, ${centerY})`);
                console.log(`Starting with random angle: ${randomStartAngle}°`);
                
                // Set up rotation handling
                let currentAngle = randomStartAngle;
                const step = 1; // Degrees to rotate per keypress
                
                // Handle keydown events for rotation
                const keyHandler = function(e) {
                  if (e.key === 'f' || e.key === 'F') {
                    // Rotate counterclockwise
                    currentAngle -= step;
                    line.set('angle', currentAngle);
                    canvas.renderAll();
                    e.preventDefault();
                    // Debug current angle
                    console.log("Current angle:", currentAngle);
                  } else if (e.key === 'j' || e.key === 'J') {
                    // Rotate clockwise
                    currentAngle += step;
                    line.set('angle', currentAngle);
                    canvas.renderAll();
                    e.preventDefault();
                    // Debug current angle
                    console.log("Current angle:", currentAngle);
                  }
                };
                
                // Add the event listener
                document.addEventListener('keydown', keyHandler);
                
                // Set up clean-up for when the trial ends
                jsPsych.getCurrentTrial().on_finish = function(data) {
                  try {
                    // Clean up event listener
                    document.removeEventListener('keydown', keyHandler);
                    
                    // Get the stimulus data from the previous trial
                    const stimulusData = jsPsych.data.get().filter({task: 'stimulus'}).last(1).values()[0];
                    console.log("Stimulus data:", stimulusData);
                    
                    if (stimulusData) {
                      // Copy forward the stimulus information
                      data.shape = shapeCondition.shape; // Direct assignment from closure variable
                        data.condition = shapeCondition.condition; // Direct assignment from closure variable
                        data.stimulus_orientation = stimulusData.orientation;

                      // Add the response information - IMPORTANT: use the current value, not the initial one
                      data.response_orientation = currentAngle; // Using the local variable with current value
                      window.currentResponseAngle = currentAngle; // Update global variable for backup
                      
                      console.log("FINAL ANGLES - Stimulus:", stimulusData.orientation, "Response:", currentAngle);
  
                     // Calculate actual deviation (absolute difference between stimulus and response)
                      // Note: 0 degrees is equivalent to 180 degrees for orientation
                      const stimulusOrientation = stimulusData.orientation % 180;
                      // Normalize response angle to 0-179 degrees range
                      let responseOrientation = currentAngle % 360;
                      if (responseOrientation < 0) responseOrientation += 360;
                      responseOrientation = responseOrientation % 180;
  
                        // Store the normalized orientations
                        data.stimulus_orientation = stimulusOrientation;
                        data.response_orientation = responseOrientation;
  
                       // Calculate the smallest angle between the two orientations
  let actualDeviation = Math.abs(stimulusOrientation - responseOrientation);
  if (actualDeviation > 90) {
    actualDeviation = 180 - actualDeviation;
  }
  
  data.actual_deviation = actualDeviation;
  
  // Calculate accuracy (0-1 scale) based on actual deviation
  const max_possible_error = 90; // For orientations in 0-180 range
  data.accuracy = 1 - (actualDeviation / max_possible_error);
  // Clip values to ensure they stay in 0-1 range
  data.accuracy = Math.max(0, Math.min(1, data.accuracy));
  
  console.log("DEVIATION AND ACCURACY CALCULATION:");
  console.log("  Stimulus orientation (mod 180):", stimulusOrientation);
  console.log("  Response orientation (mod 180):", responseOrientation);
  console.log("  Raw difference:", Math.abs(stimulusOrientation - responseOrientation));
  console.log("  Final actual deviation:", actualDeviation);
  console.log("  Accuracy score:", data.accuracy.toFixed(3));
  
                      // Apply feedback manipulation based on condition (75% of trials)
                      // Cardinal directions (0, 90, 180) always get accurate feedback
                      const isCardinalDirection = stimulusOrientation === 0 || 
                                                 stimulusOrientation === 90 || 
                                                 stimulusOrientation === 180 ||
                                                 Math.abs(stimulusOrientation - 0) < 5 ||
                                                 Math.abs(stimulusOrientation - 90) < 5 ||
                                                 Math.abs(stimulusOrientation - 180) < 5;
                                                 
                      let feedbackDeviation = actualDeviation;
                      let biasedFeedbackApplied = false;
                      
                      if (!isCardinalDirection && Math.random() < 0.75) {
                        biasedFeedbackApplied = true;
                        
                        if (data.condition === 'negative') {
                          // Negative bias: show 15 degrees MORE than actual deviation
                          feedbackDeviation = Math.min(90, actualDeviation + 15);
                        } else if (data.condition === 'positive') {
                          // Positive bias: show 15 degrees LESS than actual deviation (or 0 if very accurate)
                          feedbackDeviation = Math.max(0, actualDeviation - 15);
                        }
                        // Neutral condition shows accurate feedback (no change)
                      }
                      
                      data.feedback_deviation = feedbackDeviation;
                      data.biased_feedback_applied = biasedFeedbackApplied;
  
                      // Store this information globally as well for backup
                      window.lastResponseData = {
                        shape: data.shape,
                        condition: data.condition,
                        stimulus_orientation: data.stimulus_orientation,
                        response_orientation: data.response_orientation,
                        actual_deviation: data.actual_deviation,
                        accuracy: data.accuracy,  // Add this line
                        feedback_deviation: data.feedback_deviation,
                        biased_feedback_applied: data.biased_feedback_applied,
                        trial_nr: data.trial_nr
                      };
                      currentTrialInfo = {
                        shape: data.shape,
                        condition: data.condition,
                        stimulus_orientation: data.stimulus_orientation
                      };
                      console.log("Response data processed:", data);
                      console.log("Condition:", data.condition);
                      console.log("Actual deviation:", data.actual_deviation.toFixed(1));
                      console.log("Accuracy score:", data.accuracy.toFixed(3));  // Add this line
                      console.log("Feedback deviation:", data.feedback_deviation.toFixed(1));
                      console.log("Biased feedback applied:", data.biased_feedback_applied);
                    } else {
                      console.error("Could not find stimulus data");
                    }
                  } catch (err) {
                    console.error("Error in response trial on_finish:", err);
                  }
                };
              } catch (err) {
                console.error("Error in response trial on_load:", err);
              }
            }
          },
          
          // 4. Confidence rating
          confidence: {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
              return `
                <div style="text-align: center;">
                  <p style="font-size: 32px;">How confident are you in your orientation matching?</p>
                  <div style="width: 600px; position: relative; margin: 30px auto;">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 10px; font-size: 24px;">
                      <span>${confidence_scale_direction === 'left_low' ? '0% confidence' : '100% confidence'}</span>
                      <span>${confidence_scale_direction === 'left_low' ? '100% confidence' : '0% confidence'}</span>
                    </div>
                    <div style="width: 100%; height: 15px; background-color: #ccc; position: relative; border-radius: 10px;">
                      <div id="confidence-marker" style="position: absolute; width: 10px; height: 30px; background-color: blue; top: -8px; left: 50%; transform: translateX(-50%);"></div>
                    </div>
                  </div>
                  <p style="font-size: 24px; margin-top: 30px;">Use 'F' and 'J' to move the slider. Press SPACE to confirm.</p>
                </div>
              `;
            },
            choices: [' '],
            data: {
              task: 'confidence'
            },
            on_load: function() {
              try {
                // Initialize confidence at 50%
                let confidence = 50;
                const marker = document.getElementById('confidence-marker');
                
                // Update marker position
                const updateMarker = function() {
                  marker.style.left = confidence + '%';
                  console.log("Confidence updated:", confidence);
                };
                
                // Handle keyboard input
                const keyHandler = function(e) {
                  if (e.key === 'f' || e.key === 'F') {
                    // Move left (or decrease confidence depending on orientation)
                    confidence = Math.max(0, confidence - 1);
                    updateMarker();
                    e.preventDefault();
                  } else if (e.key === 'j' || e.key === 'J') {
                    // Move right (or increase confidence depending on orientation)
                    confidence = Math.min(100, confidence + 1);
                    updateMarker();
                    e.preventDefault();
                  }
                };
                
                document.addEventListener('keydown', keyHandler);
                
                // Clean up and save data when trial ends
                jsPsych.getCurrentTrial().on_finish = function(data) {
                  document.removeEventListener('keydown', keyHandler);
                  
                  try {
                    // Get response data from previous trial
                    const responseData = jsPsych.data.get().filter({task: 'response'}).last(1).values()[0];
                    
                    if (responseData) {
                      // Copy forward the stimulus information
                      data.shape = responseData.shape;
                      data.condition = responseData.condition;
                      data.trial_nr = responseData.trial_nr;
                      
                      // Transform confidence value if needed
                      if (confidence_scale_direction === 'right_low') {
                        data.confidence_rating = 100 - confidence;
                      } else {
                        data.confidence_rating = confidence;
                      }
                      
                      console.log("Confidence recorded:", data.confidence_rating);
                    } else if (window.lastResponseData) {
                      responseData.confidence_rating = data.confidence_rating;
                      // Try the backup data
                      data.shape = window.lastResponseData.shape;
                      data.condition = window.lastResponseData.condition;
                      data.trial_nr = window.lastResponseData.trial_nr;
                      
                      // Transform confidence value if needed
                      if (confidence_scale_direction === 'right_low') {
                        data.confidence_rating = 100 - confidence;
                      } else {
                        data.confidence_rating = confidence;
                      }
                    }
                  } catch (err) {
                    console.error("Error in confidence trial on_finish:", err);
                  }
                };
              } catch (err) {
                console.error("Error in confidence trial on_load:", err);
              }
            }
          },
          
          // 5. Feedback
          feedback: {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
              try {
                // First try to get data from our global backup
                let feedbackData = window.lastResponseData;
                
                // If that fails, try to get it from jsPsych data
                if (!feedbackData) {
                  console.log("Looking for response data in jsPsych data store");
                  const responseData = jsPsych.data.get().filter({task: 'response'}).last(1).values()[0];
                  if (responseData && responseData.feedback_deviation !== undefined) {
                    feedbackData = responseData;
                  }
                }
                
                console.log("Feedback data found:", feedbackData);
                
                // Use default values if we still can't find the data
                const feedbackDeviation = feedbackData ? feedbackData.feedback_deviation : 0;
                const feedbackClass = feedbackDeviation < 5 ? 'feedback-positive' : 'feedback-negative';
                
                return `
                  <div class="feedback ${feedbackClass}">
                    <p style="font-size: 36px;">Your orientation was off by <strong>${feedbackDeviation.toFixed(1)} degrees</strong>.</p>
                    <p style="font-size: 28px; margin-top: 20px;">Press any key to continue to the next trial.</p>
                  </div>
                `;
              } catch (err) {
                console.error("Error generating feedback:", err);
                return `
                  <div class="feedback">
                    <p style="font-size: 36px;">Your orientation was off by <strong>0.0 degrees</strong>.</p>
                    <p style="font-size: 28px; margin-top: 20px;">Press any key to continue to the next trial.</p>
                  </div>
                `;
              }
            },
            data: {
              task: 'feedback'
            },
            on_finish: function(data) {
              try {
                // Try to get the response data from our global backup
                if (window.lastResponseData) {
                  data.shape = window.lastResponseData.shape;
                  data.condition = window.lastResponseData.condition;
                  data.feedback_shown = window.lastResponseData.feedback_deviation;
                  data.trial_nr = window.lastResponseData.trial_nr;
                  console.log("Feedback trial saved data from global backup");
                } else {
                  // Fall back to jsPsych data
                  const responseData = jsPsych.data.get().filter({task: 'response'}).last(1).values()[0];
                  if (responseData) {
                    data.shape = responseData.shape;
                    data.condition = responseData.condition;
                    data.feedback_shown = responseData.feedback_deviation;
                    data.trial_nr = responseData.trial_nr;
                    console.log("Feedback trial saved data from jsPsych data store");
                  } else {
                    console.error("Could not find response data in feedback trial");
                  }
                }
              } catch (err) {
                console.error("Error in feedback trial on_finish:", err);
              }
            }
          }
        };
        
        allTrialSets.push(trialSet);
      }
    }
    
    // Shuffle all trial sets to randomize shape presentation order
    allTrialSets = jsPsych.randomization.shuffle(allTrialSets);
    
    // Flatten to create sequential timeline
    const timeline = [];
    allTrialSets.forEach(set => {
      timeline.push(set.fixation, set.stimulus, set.response, set.confidence, set.feedback);
    });
    
    return timeline;
  }
  
  // End of experiment message with data saving info
  const endMessage = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2 style="font-size: 32px;">Thank you for participating!</h2>
        <p style="font-size: 24px;">The experiment is now complete.</p>
        <p style="font-size: 24px;">Your data file will be automatically downloaded.</p>
        <p style="font-size: 24px;">Press any key to see your data summary.</p>
      </div>
    `
  };
  
  // Data display and analysis screen
  const data_summary = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      // Calculate performance metrics
      const allTrials = jsPsych.data.get().filter({task: 'response'}).values();
      
      let totalTrials = allTrials.length;
      let avgDeviation = 0;
      let conditionStats = {
        'neutral': {count: 0, avgDev: 0, avgFeedbackDev: 0},
        'negative': {count: 0, avgDev: 0, avgFeedbackDev: 0},
        'positive': {count: 0, avgDev: 0, avgFeedbackDev: 0}
      };
      
      // Calculate stats
      if (totalTrials > 0) {
        avgDeviation = allTrials.reduce((sum, trial) => sum + trial.actual_deviation, 0) / totalTrials;
        
        // Calculate per condition
        allTrials.forEach(trial => {
          if (conditionStats[trial.condition]) {
            conditionStats[trial.condition].count++;
            conditionStats[trial.condition].avgDev += trial.actual_deviation;
            conditionStats[trial.condition].avgFeedbackDev += trial.feedback_deviation;
          }
        });
        
        // Calculate averages per condition
        for (let cond in conditionStats) {
          if (conditionStats[cond].count > 0) {
            conditionStats[cond].avgDev /= conditionStats[cond].count;
            conditionStats[cond].avgFeedbackDev /= conditionStats[cond].count;
          }
        }
      }
      
      return `
        <div class="instructions">
          <h2 style="font-size: 32px;">Data Summary</h2>
          <p style="font-size: 24px;">Participant ID: ${participant_id}</p>
          <p style="font-size: 24px;">Age: ${participant_age}</p
          <p style="font-size: 24px;">Gender: ${participant_gender}</p>
          <p style="font-size: 24px;">Total trials: ${totalTrials}</p>
          <p style="font-size: 24px;">Average deviation: ${avgDeviation.toFixed(2)} degrees</p>
          
          <h3 style="font-size: 28px; margin-top: 20px;">Condition Statistics</h3>
          <table style="margin: 0 auto; border-collapse: collapse; width: 80%;">
            <tr style="background-color: #e0e0e0;">
              <th style="padding: 10px; border: 1px solid black;">Condition</th>
              <th style="padding: 10px; border: 1px solid black;">Shape</th>
              <th style="padding: 10px; border: 1px solid black;">Trials</th>
              <th style="padding: 10px; border: 1px solid black;">Avg. Actual Deviation</th>
              <th style="padding: 10px; border: 1px solid black;">Avg. Feedback Deviation</th>
            </tr>
            ${Object.entries(conditionStats).map(([cond, stats]) => {
              const shapeForCondition = shapeFeedbackConditions.find(s => s.condition === cond)?.shape || 'Unknown';
              return `
                <tr>
                  <td style="padding: 10px; border: 1px solid black;">${cond}</td>
                  <td style="padding: 10px; border: 1px solid black;">${shapeForCondition}</td>
                  <td style="padding: 10px; border: 1px solid black;">${stats.count}</td>
                  <td style="padding: 10px; border: 1px solid black;">${stats.avgDev.toFixed(2)}°</td>
                  <td style="padding: 10px; border: 1px solid black;">${stats.avgFeedbackDev.toFixed(2)}°</td>
                </tr>
              `;
            }).join('')}
          </table>
          
          <p style="font-size: 24px; margin-top: 30px;">Your data has been saved to a file named:</p>
          <p style="font-size: 20px; font-family: monospace;">orientation_experiment_${participant_id}.txt</p>
          <p style="font-size: 18px;">(Tab-delimited text file)</p>
        </div>
      `;
    },
    choices: "ALL_KEYS"
  };
  
  // Define the timeline
  const timeline = [
    participant_id_trial,
    gotofullscreen,
    welcome,
    instructions,
    condition_info_trial, // Information about conditions for testing
    ...createTrials(),
    endMessage,
    data_summary
  ];
  
  // Run the experiment
  jsPsych.run(timeline); 