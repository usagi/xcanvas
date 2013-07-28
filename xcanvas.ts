// xcanvas; XNA fravored html5/canvas-2D action game library

module xcanvas {

  // update interface
  export interface updatable_i {
    // call from game class at every update timing
    update(game_time: game_time_t);
    // game class is not call update if it is false
    get_enabled(): boolean;
    // update sorting order; small value to a fast update
    get_update_order(): number;
  }

  // draw interface
  export interface drawable_i {
    // call from game class at every draw timing
    draw(game_time: game_time_t);
    // game class is not call draw if it is false
    get_enabled(): boolean;
    // draw sorting order; small value to a fast draw
    get_draw_order(): number;
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
  }

  // game_component interface
  export interface game_component_i { }

  // game_component class
  export class game_component implements game_component_i, updatable_i {
    update(game_time: game_time_t) { }
    
    get_enabled() { return this.enabled; }
    
    get_update_order() { return this.update_order; }
    get_draw_order() { return this.draw_order; }

    // implementation of get_enabled
    enabled = true;

    // implementation of get_update_order
    update_order = 0;
    // implementation of get_draw_order
    draw_order = 0;
  }

  // drawable_game_component class
  export class drawable_game_component extends game_component implements drawable_i {
    draw(game_time: game_time_t) { }
  }

  // game class
  export class game_t {
    // the set of the game component
    components: Array<game_component>;

    // the flag of fixed framerating
    // note: false is not support for ever
    get is_fiexed_time_step() { return true; }

    // for internal; the time at the game started
    private start_time_: Date;
    // for internal the time span from the game started to a current
    private total_game_time_: Date;

    // for internal; game_time for update and draw
    private game_time: game_time_t;

    // get the time at the started
    get start_time() { return this.start_time_; }
    // get the time span of a total game time
    get total_game_time() { return this.total_game_time_; }

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

    // run the game
    run() {
      this.initialize_timers();
      
      this.update();
      setInterval(this.update, this.target_elapsed_time.getTime());
      
      this.draw();
      setInterval(this.draw, this.target_elapsed_time.getTime());
      
      return this;
    }

    // update; component to call update if it is enabled 
    update() {
      this.total_game_time_ = new Date(this.total_game_time_.getTime() + this.target_elapsed_time.getTime());
      this.components
        .filter((v)=> v.get_enabled())
        .forEach((v) => v.update(this.game_time));
    }

    // update; component to call update if it is enabled and it has draw method
    draw() {
      this.components
        .filter((v: any) => v.draw instanceof Function)
        .forEach((v: any) => v.draw(this.game_time));
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
    update(game_time: game_time_t) { this.position.add(vector2_t.mul(this.velocity, game_time.elapsed_game_time.getTime())); }
  }

  // common object; it has acceleration, velocity, position, mass and bounding
  export class accelerate_object_t extends velocity_object_t {
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
      this.velocity.add(vector2_t.mul(sum_acceleration, game_time.elapsed_game_time.getTime()));
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
    update_order = -10;
    
    bounding: bounding_t;

    apply(object: accelerate_object_t) {
      if (this.bounding.intercept(object.bounding))
        object.accelerations.push(vector2_t.div(this.force, object.mass));
    }
  }

}