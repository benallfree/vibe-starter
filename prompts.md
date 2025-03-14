- 5:30pm i want to make a 3d web game where someone skis down an endless hill. does the term "gnar gnar" refer only to snowboarding?
- 5:32pm make it go slower at first
  - when the game resets after crashing, it suddenly goes faster and the arrow keys no longer work
- 5:40pm when the player hits an obstacle, make him tumble down the hill and get back on his feet. he has 3 lives. after three lives, present a 'game over' screen that goes back to the beginning
  - the lives and the score are overlapping. also, when a life is lost, do an HUD message about it
- 5:55pm make the whole thing snow-covered and make the white blocks into jumps
  - skier.ts:294 Uncaught TypeError: Cannot read properties of undefined (reading 'left') at Object.update (skier.ts:294:15) at animate (skiGame.ts:329:11)
  - it's going super fast again
  - the slanted blocks were supposed to turn into rounded blocks that would launch the skiier into the air and do a flip. make sure if he hits trees he still dies. also, the boulders disappear about halfway up the hill and i just see this little floating snow caps that make me die.
- 6:21pm this is awesome. make him rack up mad bonus points when he jumps, make like a bunch of +10 float around as he jumps or something. and then as it goes faster, make him jump higher and farther. flips should count for +50 and he should be able to do as many as he can before landing.
- 6:26pm the little jumps are sideways, just rotate them 90 degrees
  - [reject] nope, that made the skiier flip sideways. i wanted the jumps to be turned sideways becayse right now the sloped part of the jump is on the sides of the hill instead of up/downhill
  - [reject] nope, that was better, but i meant rotate 90 about yaw, not roll
- 6:31 periodically let the player pick up a hot chocolate to gain an extra life

for later:

- periodically let the player pick up a hot chocolate to gain an extra life
- make big banners that the skiier goes under with advertisements on them
- pressing the forward arrow makes him french fry and squat down and accelerate
- pressing the back arrow makes him pizza and slow down
- moving mouse left/right/up/down does the same as arrows
- pressing left/right makes snow rooster-tail
