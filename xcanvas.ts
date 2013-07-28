// xcanvas; XNA fravored html5/canvas-2D action game library

module xcanvas {

  export interface updatable_i {
    update(game_time: game_time_t);
    get_enabled(): boolean;
    get_update_order(): number;
  }

  export interface drawable_i {
    draw(game_time: game_time_t);
    get_enabled(): boolean;
    get_draw_order(): number;
  }

  export class game_time_t {
    private game: game_t;

    constructor(game: game_t) { this.game = game; }

    get start_time() { return this.game.start_time; }

    get elapsed_game_time() { return this.game.target_elapsed_time; }
    get total_game_time() { return this.game.total_game_time; }
    get total_real_time() { return new Date(new Date().getTime() - this.start_time.getTime()); }
  }

  export interface game_component_i { }

  export class game_component implements game_component_i, updatable_i {
    update(game_time: game_time_t) { }
    
    get_enabled() { return this.enabled; }
    
    get_update_order() { return this.update_order; }
    get_draw_order() { return this.draw_order; }

    enabled = true;

    update_order = 0;
    draw_order = 0;
  }

  export class drawable_game_component extends game_component implements drawable_i {
    draw(game_time: game_time_t) { }
  }

  export class game_t {
    components: Array<game_component>;

    get is_fiexed_time_step() { return true; }

    private start_time_: Date;
    private total_game_time_: Date;

    private game_time: game_time_t;

    get start_time() { return this.start_time_; }
    get total_game_time() { return this.total_game_time_; }

    private initialize_timers() {
      this.start_time_ = new Date();
      this.total_game_time_ = new Date(0);
    }

    target_elapsed_time = new Date(1000 / 60);

    get target_frames_per_second() { return 1000 / this.target_elapsed_time.getTime(); }
    set target_frames_per_second(value: number) { this.target_elapsed_time = new Date(1000 / value); }

    run() {
      this.initialize_timers();
      
      this.update();
      setInterval(this.update, this.target_elapsed_time.getTime());
      
      this.draw();
      setInterval(this.draw, this.target_elapsed_time.getTime());
      
      return this;
    }

    update() {
      this.total_game_time_ = new Date(this.total_game_time_.getTime() + this.target_elapsed_time.getTime());
      this.components
        .filter((v)=> v.get_enabled())
        .forEach((v) => v.update(this.game_time));
    }

    draw() {
      this.components
        .filter((v: any) => v.draw instanceof Function)
        .forEach((v: any) => v.draw(this.game_time));
    }
  }

  export class vector2_t {
    constructor(x: number, y: number) { this.x = x; this.y = y; }
    x = 0;
    y = 0;
    add(a: vector2_t) { this.x += a.x; this.y += a.y; }
    sub(a: vector2_t) { this.x -= a.x; this.y -= a.y; }
    mul(a: number) { this.x *= a; this.y *= a; }
    div(a: number) { this.x /= a; this.y /= a; }
    static add(a: vector2_t, b: vector2_t) { return new vector2_t(a.x + b.x, a.y + b.y); }
    static sub(a: vector2_t, b: vector2_t) { return new vector2_t(a.x - b.x, a.y - b.y); }
    static mul(a: vector2_t, b: number) { return new vector2_t(a.x * b, a.y * b); }
    static div(a: vector2_t, b: number) { return new vector2_t(a.x / b, a.y / b); }
    static distance(a: vector2_t, b: vector2_t) {
      var _1 = vector2_t.sub(a, b);
      return Math.sqrt(_1.x * _1.x + _1.y * _1.y);
    }
    static get zero() { return new vector2_t(0, 0); }
    static get unit() { return new vector2_t(1, 1); }
  }

  export class mass_and_volume_object_t extends drawable_game_component {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none) {
      super();
      this.mass = mass;
      this.bounding = bounding;
    }
    mass = 0;
    bounding: bounding_t;
  }

  export class position_object_t extends mass_and_volume_object_t {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none, position: vector2_t = vector2_t.zero) {
      super(mass, bounding);
      this.position = position;
    }
    position = vector2_t.zero;
  }

  export class velocity_object_t extends position_object_t {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none, position: vector2_t = vector2_t.zero, velocity: vector2_t = vector2_t.zero) {
      super(mass, bounding, position);
      this.velocity = velocity;
    }
    velocity = vector2_t.zero;
    update(game_time: game_time_t) { this.position.add(vector2_t.mul(this.velocity, game_time.elapsed_game_time.getTime())); }
  }

  export class accelerate_object_t extends velocity_object_t {
    constructor(mass: number = 0, bounding: bounding_t = bounding_t.none, position: vector2_t = vector2_t.zero, velocity: vector2_t = vector2_t.zero, accelerations: Array<vector2_t> = []) {
      super(mass, bounding, position, velocity);
      this.accelerations = accelerations;
    }
    accelerations: Array<vector2_t>;
    update(game_time: game_time_t) {
      var sum_acceleration = this.accelerations.reduce((p, c) => vector2_t.add(p, c), vector2_t.zero);
      this.velocity.add(vector2_t.mul(sum_acceleration, game_time.elapsed_game_time.getTime()));
    }
  }

  export enum bounding_type_e {
    none, point, circle, box
  }

  export class bounding_t {
    get bounding_type() { return bounding_type_e.none; }

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

    intercept_vs_point(a: bounding_point_t) { return false; }
    intercept_vs_circle(a: bounding_circle_t) { return false; }
    intercept_vs_box(a: bounding_box_t) { return false; }

    static get none() { return new bounding_t(); }
  }

  export class bounding_point_t extends bounding_t {
    constructor(point: vector2_t) { super(); this.point = point; }

    get bounding_type() { return bounding_type_e.point; }

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

  export class bounding_circle_t extends bounding_t {
    get bounding_type() { return bounding_type_e.circle; }

    center = vector2_t.zero;
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

  export class bounding_box_t extends bounding_t {
    get bounding_type() { return bounding_type_e.box; }

    point_left_top = vector2_t.zero;
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