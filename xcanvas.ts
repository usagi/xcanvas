// xcanvas; XNA fravored html5/canvas-2D action game library

module xcanvas {

  // update interface
  export interface updatable_i {
    // call from game class at every update timing
    update(game_time: game_time_t);
    // game class is not call update if it is false
    enabled: boolean;
    // update sorting order; small value to a fast update
    update_order: number;
  }

  // draw interface
  export interface drawable_i {
    // call from game class at every draw timing
    draw(game_time: game_time_t, draw_target_context: CanvasRenderingContext2D);
    // game class is not call draw if it is false
    enabled: boolean;
    // draw sorting order; small value to a fast draw
    draw_order: number;
  }

  // order priority enum for use update_order and draw_order
  export enum order_priority {
    // for super high priority; mainly using basic system(e.g. input_manager)
    super_high = -1000,
    // for very high priority
    very_high = -100,
    // for high priority
    high = -10,
    // for default
    medium = 0,
    // for low priority
    low = 10,
    // for very low priority
    very_low = 100,
    // for super low priority
    super_low = 1000
  }

  // game_time class
  export class game_time_t {
    // reference of the game class
    private game: game_t;

    // ctor
    constructor(game: game_t) { this.game = game; }

    // get the time at the game start
    get start_time() { return this.game.start_time; }

    // get the time elapsed from before called
    get elapsed_game_time() { return this.game.target_elapsed_time; }
    // get the time span from the game start to current calling in the game time
    get total_game_time() { return this.game.total_game_time; }
    // get the time span from the game start to current calling in the real time
    get total_real_time() { return new Date(new Date().getTime() - this.start_time.getTime()); }

    // get the elapse_game_time in [sec]
    get elapsed_game_time_in_seconds() { return helper.get_total_seconds(this.elapsed_game_time); }
    // get the total_game_time in [sec]
    get total_game_time_in_seconds() { return helper.get_total_seconds(this.total_game_time); }
    // get the total_real_time in [sec]
    get total_real_time_in_seconds() { return helper.get_total_seconds(this.total_real_time); }
  }

  // game_component interface
  export interface game_component_i {
    is_persistent: boolean;
  }

  // game_component class
  export class game_component implements game_component_i, updatable_i {
    get is_persistent() { return false; }

    update(game_time: game_time_t) { }
    
    enabled = true;

    update_order = order_priority.medium;
    draw_order = order_priority.medium;
  }

  // drawable_game_component class
  export class drawable_game_component extends game_component implements drawable_i {
    draw(game_time: game_time_t, draw_target_context: CanvasRenderingContext2D) { }
  }

  // game class
  export class game_t {
    constructor(draw_target_context: CanvasRenderingContext2D) { this.draw_target_context = draw_target_context; }

    private draw_target_context: CanvasRenderingContext2D;

    // the set of the game component
    components: Array<game_component> = [];

    // the flag of fixed framerating
    // note: false is not support for ever
    get is_fiexed_time_step() { return true; }

    // for internal; the time at the game started
    private start_time_: Date;
    // for internal the time span from the game started to a current
    private total_game_time_: Date;

    // for internal; game_time for update and draw
    private game_time: game_time_t;

    // for internal; transform martix
    transform_matrix = helper.createSVGMatrix();

    // get the time at the started
    get start_time() { return this.start_time_; }
    // get the time span of a total game time
    get total_game_time() { return this.total_game_time_; }

    initialize(){
      this.initialize_timers();
    }

    // for internal; initialize timers
    private initialize_timers() {
      this.start_time_ = new Date();
      this.total_game_time_ = new Date(0);
    }

    // target elapsed time; default is 1000/60[sec](=60[FPS])
    target_elapsed_time = new Date(1000 / 60);

    // get a frame rate in [FPS]
    get target_frames_per_second() { return 1000 / this.target_elapsed_time.getTime(); }
    // set a frame rate in [FPS]
    set target_frames_per_second(value: number) { this.target_elapsed_time = new Date(1000 / value); }

    get is_running() { return this.is_running_; }
    private is_running_ = false;

    // run the game
    run() {
      if(this.is_running_)
        throw "logic error: already running";
      this.is_running_ = true;
      this.initialize();
      this.request_animation_frame();
      return this;
    }

    get is_suspended() { return this.is_suspended_; }
    private is_suspended_ = false;

    suspend() {
      if(this.is_suspended_)
        throw "logic error: aleady suspended";
      this.cancel_animation_frame();
      this.is_suspended_ = true;
    }

    resume() {
      if(!this.is_suspended_)
        throw "logic error: not suspended";
      this.is_suspended_ = false;
      this.request_animation_frame();
    }

    // to exit the game
    exit() { this.cancel_animation_frame(); }

    animation_request_id: number;

    // for internal; helper metohd to call the requestAnimationFrame API
    private request_animation_frame() {
      var r = window.requestAnimationFrame || (<any>window).mozRequestAnimationFrame || (<any>window).webkitRequestAnimationFrame || (<any>window).msRequestAnimationFrame;
      this.animation_request_id = r(this.animation_frame.bind(this));
    }

    private cancel_animation_frame() {
      var c = window.cancelAnimationFrame || (<any>window).mozCancelAnimationFrame || (<any>window).webkitCancelAnimationFrame || (<any>window).msCancelAnimationFrame;
      c(this.animation_request_id);
    }

    // for internal; callback for requestAnimationFrame API
    animation_frame() {
      this.update();
      this.draw();
      this.request_animation_frame();
    }

    // it is true if frame rate to slowly
    is_running_slowly = false;

    // update; component to call update if it is enabled 
    update() {
      // get the time at this method started
      var time_update_started = new Date();
      // refresh total game time
      this.total_game_time_ = new Date(this.total_game_time_.getTime() + this.target_elapsed_time.getTime());
      // update components
      this.components
        .filter((v: game_component) => v.enabled)
        .forEach((v: game_component) => v.update(this.game_time));
      // calc the time of the current method elapsed
      var current_elapsed_time = new Date().getTime() - time_update_started.getTime();
      // load member property to local storage
      var target_elapsed_time = this.target_elapsed_time.getTime();
      // is running slowly?
      this.is_running_slowly = current_elapsed_time > target_elapsed_time;
    }

    // draw; component to call update if it is enabled and it has draw method
    draw() {
      this.components
        .filter((v: any) => v.draw instanceof Function)
        .forEach((v: any) => {
            this.draw_target_context.save();
            this.draw_target_context.transform
              ( this.transform_matrix.a, this.transform_matrix.b, this.transform_matrix.c
              , this.transform_matrix.d, this.transform_matrix.e, this.transform_matrix.f
              );
            v.draw(this.game_time, this.draw_target_context)
            this.draw_target_context.restore();
          }
        );
    }
  }

  // common 2D-vector class
  export class vector2_t {
    // ctor
    constructor(x: number, y: number) { this.x = x; this.y = y; }
    // coordinate x
    x = 0;
    // coordinate y
    y = 0;
    // operator add with one of vector2_t
    add(a: vector2_t) { this.x += a.x; this.y += a.y; }
    // operator sub with one of vector2_t
    sub(a: vector2_t) { this.x -= a.x; this.y -= a.y; }
    // operator mul with one of number
    mul(a: number) { this.x *= a; this.y *= a; }
    // operator div with one of number
    div(a: number) { this.x /= a; this.y /= a; }
    // static add
    static add(a: vector2_t, b: vector2_t) { return new vector2_t(a.x + b.x, a.y + b.y); }
    // static sub
    static sub(a: vector2_t, b: vector2_t) { return new vector2_t(a.x - b.x, a.y - b.y); }
    // static mul
    static mul(a: vector2_t, b: number) { return new vector2_t(a.x * b, a.y * b); }
    // static div
    static div(a: vector2_t, b: number) { return new vector2_t(a.x / b, a.y / b); }
    // static distance
    static distance(a: vector2_t, b: vector2_t) {
      var _1 = vector2_t.sub(a, b);
      return Math.sqrt(_1.x * _1.x + _1.y * _1.y);
    }
    // get the zero vector
    static get zero() { return new vector2_t(0, 0); }
    // get the unit vector
    static get unit() { return new vector2_t(1, 1); }
  }

  // common object; it has mass and volume(bounding)
  export class mass_and_volume_object_t extends drawable_game_component {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none) {
      super();
      this.mass = mass;
      this.bounding = bounding;
    }
    // mass
    mass = 0;
    // bounding
    bounding: bounding_t;
  }

  // common object; it has position, mass and bounding
  export class position_object_t extends mass_and_volume_object_t {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none, position: vector2_t = vector2_t.zero) {
      super(mass, bounding);
      this.position = position;
    }
    // position
    position = vector2_t.zero;
    // default draw; visualize bounding with red stroke 
    draw(game_time: game_time_t, draw_target_context: CanvasRenderingContext2D) {
      // ToDo: change to use camera with Issue #11
      draw_target_context.translate(this.position.x, this.position.y);

      draw_target_context.strokeStyle = 'red';

      switch(this.bounding.bounding_type)
      {
        case bounding_type_e.point:
          //draw_target_context.rect(0, 0, 0, 0);
          break;
        case bounding_type_e.circle:
          var c = <bounding_circle_t>this.bounding;
          draw_target_context.arc(c.center.x, c.center.y, c.radius, 0, 2 * Math.PI);
          break;
        case bounding_type_e.box:
          var b = <bounding_box_t>this.bounding;
          draw_target_context.rect(b.point_left_top.x, b.point_right_bottom.y, b.point_right_bottom.x, b.point_right_bottom.y);
          break;
      }

      draw_target_context.stroke();
    }
  }

  // common object; it has velocity, position, mass and bounding
  export class velocity_object_t extends position_object_t {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none, position: vector2_t = vector2_t.zero, velocity: vector2_t = vector2_t.zero) {
      super(mass, bounding, position);
      this.velocity = velocity;
    }
    // velocity
    velocity = vector2_t.zero;
    // update; refresh position using velocity and delta-time
    update(game_time: game_time_t) { this.position.add(vector2_t.mul(this.velocity, game_time.elapsed_game_time_in_seconds)); }
  }

  // common object; it has acceleration, velocity, position, mass and bounding
  export class acceleration_object_t extends velocity_object_t {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none, position: vector2_t = vector2_t.zero, velocity: vector2_t = vector2_t.zero, accelerations: Array<vector2_t> = []) {
      super(mass, bounding, position, velocity);
      this.accelerations = accelerations;
    }
    // accelerations; it is update every frame from force instances
    accelerations: Array<vector2_t>;
    // update; refresh velocity using accelerations and delta-time
    update(game_time: game_time_t) {
      // calc the sum of accelerations
      var sum_acceleration = this.accelerations.reduce((p, c) => vector2_t.add(p, c), vector2_t.zero);
      // update velocity
      this.velocity.add(vector2_t.mul(sum_acceleration, game_time.elapsed_game_time_in_seconds));
      // call super object update
      super.update(game_time);
    }
  }

  // bounding types
  export enum bounding_type_e {
    none, point, circle, box
  }

  // base bounding type
  export class bounding_t {
    // for intercept switching
    get bounding_type() { return bounding_type_e.none; }

    // intercept interface
    intercept(a: any) {
      if (a instanceof bounding_t)
        {
        switch (a.bounding_type)
        {
          case bounding_type_e.point: return this.intercept_vs_point(a);
          case bounding_type_e.circle: return this.intercept_vs_circle(a);
          case bounding_type_e.box: return this.intercept_vs_box(a);
        }
      }
      return false;
    }

    // for internal; vs. bounding_point
    intercept_vs_point(a: bounding_point_t) { return false; }
    // for internal; vs. bounding_circle
    intercept_vs_circle(a: bounding_circle_t) { return false; }
    // for internal; vs. bounding_box
    intercept_vs_box(a: bounding_box_t) { return false; }

    static get none() { return new bounding_t(); }
  }

  // bounding point class
  export class bounding_point_t extends bounding_t {
    constructor(point: vector2_t) { super(); this.point = point; }

    get bounding_type() { return bounding_type_e.point; }

    // point
    point = vector2_t.zero;

    intercept_vs_point(a: bounding_point_t): boolean { return this.point == a.point; }
    intercept_vs_circle(a: bounding_circle_t): boolean { return vector2_t.distance(a.center, this.point) <= a.radius; }
    intercept_vs_box(a: bounding_box_t): boolean {
      return this.point.x >= a.point_left_top.x
        && this.point.x <= a.point_right_bottom.x
        && this.point.y <= a.point_left_top.y
        && this.point.y >= a.point_right_bottom.y
        ;
    }
  }

  // bounding circle class
  export class bounding_circle_t extends bounding_t {
    get bounding_type() { return bounding_type_e.circle; }

    // center of this circle
    center = vector2_t.zero;
    // radius of this circle
    radius = 0;

    intercept_vs_point(a: bounding_point_t): boolean { return a.intercept_vs_circle(this); }
    intercept_vs_circle(a: bounding_circle_t): boolean { return vector2_t.distance(a.center, this.center) <= a.radius + this.radius; }
    intercept_vs_box(a: bounding_box_t): boolean {
      // the circle is in the box?
      if (a.intercept_vs_point(new bounding_point_t(this.center)))
        return true;

      // the circle is collisions to a corner of the box?
      if (this.intercept_vs_point(new bounding_point_t(a.point_left_top))
        || this.intercept_vs_point(new bounding_point_t(new vector2_t(a.point_left_top.x, a.point_right_bottom.y)))
        || this.intercept_vs_point(new bounding_point_t(new vector2_t(a.point_right_bottom.x, a.point_left_top.y)))
        || this.intercept_vs_point(new bounding_point_t(a.point_right_bottom))
        )
        return true;

      // the circle is collisions to a arris of the box?
      if (this.center.y <= a.point_left_top.y && this.center.y >= a.point_right_bottom.y)
      {
        if (this.center.x < a.point_left_top.x && a.point_left_top.x - this.center.x <= this.radius)
          return true;
        else if (this.center.x > a.point_right_bottom.x && this.center.x - a.point_right_bottom.x <= this.radius)
          return true;
      }
      else if (this.center.x >= a.point_left_top.x && this.center.x <= a.point_right_bottom.x)
      {
        if (this.center.y > a.point_left_top.y && this.center.y - a.point_left_top.y <= this.radius)
          return true;
        else if (this.center.y < a.point_right_bottom.y && a.point_right_bottom.y - this.center.y <= this.radius)
          return true;
      }

      // no collisions
      return false;
    }
  }

  // bounding box class
  export class bounding_box_t extends bounding_t {
    get bounding_type() { return bounding_type_e.box; }

    // letf-top point of this box
    point_left_top = vector2_t.zero;
    // right-bottom point of this box
    point_right_bottom = vector2_t.zero;

    intercept_vs_point(a: bounding_point_t) { return a.intercept_vs_box(this); }
    intercept_vs_circle(a: bounding_circle_t) { return a.intercept_vs_box(this); }
    intercept_vs_box(a: bounding_box_t) {
      return a.intercept_vs_point(new bounding_point_t(this.point_left_top))
        || a.intercept_vs_point(new bounding_point_t(new vector2_t(this.point_left_top.x, this.point_right_bottom.y)))
        || a.intercept_vs_point(new bounding_point_t(new vector2_t(this.point_right_bottom.x, this.point_left_top.y)))
        || a.intercept_vs_point(new bounding_point_t(this.point_right_bottom))
        ;
    }
  }

  // common force object class
  export class force_t extends drawable_game_component {
    constructor(bounding: bounding_t) { super(); this.bounding = bounding; }

    force = vector2_t.zero;
    update_order = order_priority.high;
    
    bounding: bounding_t;

    apply(object: acceleration_object_t) {
      if (this.bounding.intercept(object.bounding))
        object.accelerations.push(vector2_t.div(this.force, object.mass));
    }
  }

  // collision interface
  export interface collision_i {
    collision(target: collision_i);
  }

  export class collision_manager extends game_component {
    constructor(game: game_t) {
      super();
      this.game = game;
    }

    private game: game_t;

    get update_order() { return order_priority.very_high; }

    update(game_time: game_time_t) {
      this.game.components
        .filter((c: any) => c.collision)
        .forEach((c, c_i, s) => {
          for (var t_i in s) {
            var c_ = <collision_i><any>c;
            var t_ = <collision_i><any>s[t_i];
            c_.collision(t_);
            t_.collision(c_);
          }
        });
    }
  }

  // input devices; convertible to modern game controllers
  export enum input_e {
    // A, B
    button_A, button_B,
    // X, Y
    button_X, button_Y,
    // L, R
    button_L, button_R,
    // triggers
    trigger_L, trigger_R,
    // POV
    pov,
    // sticks
    stick_L, stick_R,
    // select, start
    select, start,
    // big X
    X
  }

  // input POV device state
  export enum pov_e {
    none,
    up,
    up_right,
    right,
    down_right,
    down,
    down_left,
    left,
    up_left
  }

  // input button device state
  export enum button_e {
    released = -2,
    releasing = -1,
    unkown = 0,
    pressing = 1,
    pressed = 2
  }

  // input state for use input state snapshot
  export class input_state_t {
    states = [];
    constructor() {
      this.states[input_e.button_A] = button_e.unkown;
      this.states[input_e.button_B] = button_e.unkown;
      this.states[input_e.button_X] = button_e.unkown;
      this.states[input_e.button_Y] = button_e.unkown;
      this.states[input_e.button_L] = button_e.unkown;
      this.states[input_e.button_R] = button_e.unkown;
      this.states[input_e.trigger_L] = 0;
      this.states[input_e.trigger_R] = 0;
      this.states[input_e.pov] = pov_e.none;
      this.states[input_e.stick_L] = vector2_t.zero;
      this.states[input_e.stick_R] = vector2_t.zero;
      this.states[input_e.select] = button_e.unkown;
      this.states[input_e.start] = button_e.unkown;
      this.states[input_e.X] = button_e.unkown;
    }
    // true if button is pressed and pressing
    is_button_press(button: input_e) { return this.states[button] > button_e.unkown; }
  }

  export class input_manager_t extends game_component {
    constructor() {
      super();

      this.input_state_before = new input_state_t();
      this.input_state_current = new input_state_t();
      this.input_state_next = new input_state_t();

      document.addEventListener('keydown', (e: KeyboardEvent) => {
        switch(e.keyCode)
        {
          // v --> button_A
          case 73: this.set_next_button_state(input_e.button_A); break;
          // g --> button_B
          case 74: this.set_next_button_state(input_e.button_B); break;
          // c --> button_X
          case 75: this.set_next_button_state(input_e.button_X); break;
          // f --> button_Y
          case 76: this.set_next_button_state(input_e.button_Y); break;

          // q --> button_L
          case 81: this.set_next_button_state(input_e.button_L); break;
          // e --> button_R
          case 69: this.set_next_button_state(input_e.button_R); break;

          // 1 --> trigger_L
          case 49: this.input_state_next[input_e.trigger_L] = 1; break;
          // 3--> trigger_R
          case 51: this.input_state_next[input_e.trigger_R] = 1; break;

          // 7 --> button_select
          case 55: this.set_next_button_state(input_e.select); break;
          // 9--> button_start
          case 57: this.set_next_button_state(input_e.start); break;
          
          // 8--> button_X
          case 56: this.set_next_button_state(input_e.X); break;

          // w --> stick_L up
          case 87: this.input_state_next[input_e.stick_L] = new vector2_t(0, 1); break;
          // a --> stick_L left
          case 65: this.input_state_next[input_e.stick_L] = new vector2_t(-1, 0); break;
          // s --> stick_L down
          case 83: this.input_state_next[input_e.stick_L] = new vector2_t(0, -1); break;
          // d --> stick_L right
          case 68: this.input_state_next[input_e.stick_L] = new vector2_t(1, 0); break;

          // i --> stick_R up
          case 73: this.input_state_next[input_e.stick_R] = new vector2_t(0, 1); break;
          // j --> stick_R left
          case 74: this.input_state_next[input_e.stick_R] = new vector2_t(-1, 0); break;
          // k --> stick_R down
          case 75: this.input_state_next[input_e.stick_R] = new vector2_t(0, -1); break;
          // l --> stick_R right
          case 76: this.input_state_next[input_e.stick_R] = new vector2_t(1, 0); break;

          // num 8 --> POV up
          case 104: this.input_state_next[input_e.pov] = pov_e.up; break;
          // num 9 --> POV up right
          case 105: this.input_state_next[input_e.pov] = pov_e.up_right; break;
          // num 6 --> POV right
          case 102: this.input_state_next[input_e.pov] = pov_e.right; break;
          // num 3 --> POV down right
          case 99: this.input_state_next[input_e.pov] = pov_e.down_right; break;
          // num 2 --> POV down
          case 98: this.input_state_next[input_e.pov] = pov_e.down; break;
          // num 1 --> POV down left
          case 97: this.input_state_next[input_e.pov] = pov_e.down_left; break;
          // num 4 --> POV left
          case 100: this.input_state_next[input_e.pov] = pov_e.left; break;
          // num 7 --> POV up left
          case 103: this.input_state_next[input_e.pov] = pov_e.up_left; break;
        }
      });
    }

    get is_persistent() { return true; }

    // for internal; set next button state helper method
    private set_next_button_state(button: input_e) {
      this.input_state_next[button]
        = this.input_state_before.is_button_press(button)
        ? button_e.pressed
        : button_e.pressing;
    }

    // for internal; call from initialize_next_button_states
    private initialize_next_button_helper(button: input_e){
      this.input_state_next[button] = this.input_state_next.is_button_press(button)
        ? button_e.releasing
        : button_e.released
        ;
    }

    // for internal; initialize next button state
    private initialize_next_button_state(){
      this.initialize_next_button_helper(input_e.button_A);
      this.initialize_next_button_helper(input_e.button_B);
      this.initialize_next_button_helper(input_e.button_X);
      this.initialize_next_button_helper(input_e.button_Y);

      this.initialize_next_button_helper(input_e.button_L);
      this.initialize_next_button_helper(input_e.button_R);

      this.initialize_next_button_helper(input_e.select);
      this.initialize_next_button_helper(input_e.start);
      
      this.initialize_next_button_helper(input_e.X);

      this.input_state_next[input_e.trigger_L] = 0;
      this.input_state_next[input_e.trigger_R] = 0;

      this.input_state_next[input_e.stick_L] = vector2_t.zero;
      this.input_state_next[input_e.stick_L] = vector2_t.zero;
      this.input_state_next[input_e.stick_L] = vector2_t.zero;
      this.input_state_next[input_e.stick_L] = vector2_t.zero;
      
      this.input_state_next[input_e.stick_R] = vector2_t.zero;
      this.input_state_next[input_e.stick_R] = vector2_t.zero;
      this.input_state_next[input_e.stick_R] = vector2_t.zero;
      this.input_state_next[input_e.stick_R] = vector2_t.zero;
    }

    // get delta value from before to current for sticks and triggers
    get_delta_value(value_device: input_e) { return vector2_t.sub(this.input_state_current[value_device], this.input_state_before[value_device]); }

    // update order; super high priority
    update_order = order_priority.super_high;

    // update
    update(game_time: game_time_t) {
      // refresh input_state_before
      this.input_state_before = this.input_state_current;
      this.input_state_current = this.input_state_next;
      this.initialize_next_button_state();
    }

    // for internal; input state
    private input_state_next: input_state_t;
    private input_state_current: input_state_t;
    private input_state_before: input_state_t;
  }

  export class scene_manager_t extends game_component {
    constructor(game: game_t, default_scene: scene_t) {
      super();
      this.game = game;
      this.default_scene = default_scene;
      // set scene property
      this.set_scene_property(default_scene);
    }

    get is_persistent() { return true; }

    game: game_t;
    default_scene: scene_t;

    private scene_stack: Array<scene_t> = [];

    private get last_scene() { return this.scene_stack.slice(-1)[0]; }

    // set scene property
    private set_scene_property(scene: scene_t){
      scene.game = this.game;
      scene.scene_manager = this;
    }

    push(scene: scene_t) {
      // store current scene components
      var current_components = this.game.components;
      this.last_scene.components = [];
      this.game.components = [];
      current_components.forEach((c: game_component) => {
        if (c.is_persistent)
          this.game.components.push(c);
        else
          this.last_scene.components.push(c);
      });
      
      // suspend current scene
      this.last_scene.suspend();

      // set scene_property
      this.set_scene_property(scene);

      // push new scene
      this.scene_stack.push(scene);

      // load components to new scne
      this.game.components.concat(this.last_scene.components);
      this.last_scene.components = this.game.components;
    }

    pop() {
      // pop a current scene
      this.scene_stack.pop().poped();

      // filter and concat game components with resuming scene
      this.game.components
        .filter((c: game_component) => c.is_persistent)
        .concat(this.last_scene)
      ;

      // resuming scene
      this.last_scene.resume();
    }

    upgate(game_time: game_time_t) {
      if (this.scene_stack.length === 0) {
        this.push(this.default_scene.initialize());
      }
    }
  }

  export interface scene_i extends game_component_i {
    // scene initializer
    initialize(): scene_i;
    // call on scene resume timing
    resume();
    // call on scene suspend timing
    suspend();
    // call on scene pushed timing
    pushed();
    // call on scene poped timing
    poped();
    // current game.components in active scene
    components: Array<game_component>;
  }

  export class scene_t extends game_component implements scene_i {
    // auto set on push to scene_manager
    game: game_t;
    // auto set on push to scene_manager
    scene_manager: scene_manager_t;

    initialize() { return this; }
    resume() { }
    suspend() { }
    pushed() { }
    poped() { }
    components: Array<game_component> = [];
  }

  export class camera_t extends game_component {
    constructor(game: game_t) {
      super();
      this.game = game;
    }

    game: game_t;
    position = vector2_t.zero;

    get update_order() { return order_priority.super_high; }

    update(game_time: game_time_t) {
      this.game.transform_matrix = this.transform_matrix;
    }

    get transform_matrix() {
      var t = helper.createSVGMatrix();
      t.translate(this.position.x, this.position.y);
      return t;
    }
  }

  export class tracking_camera_t extends camera_t {
    // target: tracking target object
    // offset: tracking position offset
    // margin: tracking position margin
    // factor: tracking velocity factor;
    constructor(game: game_t,target: position_object_t, offset = vector2_t.zero, margin = vector2_t.zero, factor = vector2_t.unit) {
      super(game);
      this.target = target;
      this.offset = offset;
      this.margin = margin;
      this.factor = factor;
    }

    target: position_object_t;

    offset: vector2_t;
    margin: vector2_t;
    factor: vector2_t;

    update(game_time: game_time_t) {
      var offseted_target_position = vector2_t.add(this.target.position, this.offset);
      var delta_position = vector2_t.sub(offseted_target_position, this.position);
      var sign = (v: number) => (v > 0) ? 1 : -1;
      var margined_delta_position = new vector2_t
        ( delta_position.x - sign(delta_position.x) * this.margin.x
        , delta_position.y - sign(delta_position.y) * this.margin.y
        );
      var velocity = new vector2_t(margined_delta_position.x * this.factor.x, margined_delta_position.y * this.factor.y);
      this.position = vector2_t.add(this.position, vector2_t.mul(velocity, game_time.elapsed_game_time_in_seconds));

      super.update(game_time);
    }
  }

  export class helper {
    static createSVGMatrix() { return (<SVGSVGElement>document.createElementNS('http://www.w3.org/2000/svg', 'svg')).createSVGMatrix(); }
    static get_total_seconds(t: Date) { return t.getTime() * 0.001; }
  }

}
