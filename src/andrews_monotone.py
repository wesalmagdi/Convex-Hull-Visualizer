import numpy as np
import matplotlib.pyplot as plt
from convex_hull import BaseConvexHullVisualizer

class AndrewsMonotoneVisualizer(BaseConvexHullVisualizer):
    def __init__(self, fig=None, ax=None, back_callback=None):
        super().__init__(fig=fig, ax=ax, back_callback=back_callback)
        self.sorted_points = None
        self.upper_hull = []
        self.lower_hull = []
        self.current_point_index = 0
        self.hull_points = None
        self.phase = 0

    def get_algorithm_name(self):
        return "Andrew's Monotone Chain"

    def initialize_algorithm(self):
        if len(self.points) < 3:
            self.hull_points = np.array(self.points) if self.points else np.array([])
            return

        self.sorted_points = sorted(self.points, key=lambda p: (p[0], p[1]))

        self.upper_hull = []
        self.lower_hull = []

        self.current_point_index = 0
        self.hull_points = None
        self.phase = 0

    def step_algorithm(self):
        if self.hull_points is not None:
            return True

        if self.sorted_points is None or len(self.sorted_points) < 3:
            self.hull_points = np.array(self.points) if self.points else np.array([])
            return True

        n = len(self.sorted_points)

        if self.phase == 0:
            if self.current_point_index < n:
                p = self.sorted_points[self.current_point_index]
                while len(self.lower_hull) >= 2 and self.orientation(self.lower_hull[-2], self.lower_hull[-1], p) != 2:
                    self.lower_hull.pop()
                self.lower_hull.append(p)
                self.current_point_index += 1
            else:
                self.phase = 1
                self.current_point_index = n - 2

        elif self.phase == 1:
            if self.current_point_index >= 0:
                p = self.sorted_points[self.current_point_index]
                while len(self.upper_hull) >= 2 and self.orientation(self.upper_hull[-2], self.upper_hull[-1], p) != 2:
                    self.upper_hull.pop()
                self.upper_hull.append(p)
                self.current_point_index -= 1
            else:
                if len(self.lower_hull) > 0 and len(self.upper_hull) > 0:
                     combined_hull = self.lower_hull + self.upper_hull[1:-1]
                     self.hull_points = np.array(combined_hull)
                elif len(self.lower_hull) > 0:
                     self.hull_points = np.array(self.lower_hull)
                elif len(self.upper_hull) > 0:
                     self.hull_points = np.array(self.upper_hull)
                else:
                     self.hull_points = np.array([])

                return True

        if self.phase == 0 and self.current_point_index > 0:
             self.current_point = self.sorted_points[self.current_point_index - 1]
        elif self.phase == 1 and self.current_point_index < n - 2:
             self.current_point = self.sorted_points[self.current_point_index + 1]
        elif self.hull_points is not None and len(self.hull_points) > 0:
             self.current_point = self.hull_points[0] if len(self.hull_points) > 0 else None
        else:
             self.current_point = None

        return False

    def update_plot(self, frame):
        self.ax.clear()

        if len(self.points) > 0:
            points_array = np.array(self.points)
            self.ax.scatter(points_array[:, 0], points_array[:, 1],
                          c='#2196F3', label='Points', s=100)

        if self.sorted_points is not None and 0 <= self.current_point_index < len(self.sorted_points):
             current_p = self.sorted_points[self.current_point_index]
             self.ax.scatter([current_p[0]], [current_p[1]],
                           c='#4CAF50', s=200, label='Current Point', marker='*')

        # Only show lower/upper hulls if the final hull is not yet computed
        if self.hull_points is None:
            if len(self.lower_hull) > 0:
                lower_hull_array = np.array(self.lower_hull)
                self.ax.plot(lower_hull_array[:, 0], lower_hull_array[:, 1],
                            color='#FF5722', linestyle='-', linewidth=2, label='Lower Hull')
                self.ax.scatter(lower_hull_array[:, 0], lower_hull_array[:, 1],
                               c='#FF5722', s=100)

            if len(self.upper_hull) > 0:
                upper_hull_array = np.array(self.upper_hull)
                self.ax.plot(upper_hull_array[:, 0], upper_hull_array[:, 1],
                            color='#FF9800', linestyle='-', linewidth=2, label='Upper Hull')
                self.ax.scatter(upper_hull_array[:, 0], upper_hull_array[:, 1],
                               c='#FF9800', s=100)

        if self.hull_points is not None:
            hull = np.vstack((self.hull_points, self.hull_points[0]))
            self.ax.plot(hull[:, 0], hull[:, 1],
                        color='#4CAF50', linestyle='-',
                        linewidth=2, label='Final Hull')

        self.ax.set_title(f'Convex Hull using {self.get_algorithm_name()}', pad=20, fontsize=14, color='white')
        self.ax.legend(loc='upper right', facecolor='#2D2D2D', edgecolor='#444444', labelcolor='white')
        self.ax.grid(True, color='#444444', linestyle='--', alpha=0.3)

        if len(self.points) > 0:
            points_array = np.array(self.points)
            x_min, x_max = points_array[:, 0].min(), points_array[:, 0].max()
            y_min, y_max = points_array[:, 1].min(), points_array[:, 1].max()
            margin = 1
            self.ax.set_xlim(x_min - margin, x_max + margin)
            self.ax.set_ylim(y_min - margin, y_max + margin)
        else:
             self.ax.set_xlim(-10, 10)
             self.ax.set_ylim(-10, 10)

        if len(self.points) >= 3 and self.hull_points is None:
            self.step_algorithm()
        plt.draw()

    def add_point(self, event):
        try:
            coords = self.text_box.text.split()
            if len(coords) != 2:
                return
            x, y = map(float, coords)
            self.points.append([x, y])
            self.initialize_algorithm()
            self.hull_points = None
            self.update_plot(0)
            self.text_box.set_val('')
            plt.draw()
        except ValueError:
            pass

    def remove_last_point(self, event):
        if self.points:
            self.points.pop()
            self.initialize_algorithm()
            self.hull_points = None
            self.update_plot(0)
            plt.draw() 