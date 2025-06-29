import numpy as np
import matplotlib.pyplot as plt
from convex_hull import BaseConvexHullVisualizer

class GiftWrappingVisualizer(BaseConvexHullVisualizer):
    def __init__(self, fig=None, ax=None, back_callback=None):
        super().__init__(fig=fig, ax=ax, back_callback=back_callback)
        self.hull_points = []
        self.current_point = None
        self.start_point = None
        self.endpoint = None
        self.point_on_hull = None

    def get_algorithm_name(self):
        return "Gift Wrapping (Jarvis March)"

    def initialize_algorithm(self):
        if len(self.points) < 3:
            self.hull_points = np.array(self.points) if self.points else np.array([])
            self.point_on_hull = self.points[0] if self.points else None
            self.start_point = self.point_on_hull
            self.endpoint = None
            self.current_point = None
            return

        self.start_point = min(self.points, key=lambda p: (p[1], p[0]))
        self.point_on_hull = self.start_point
        self.hull_points = []
        self.endpoint = None
        self.current_point = None

    def step_algorithm(self):
        if self.point_on_hull is None:
            if len(self.points) < 3:
                self.hull_points = np.array(self.points) if self.points else np.array([])
                return True
            self.start_point = min(self.points, key=lambda p: (p[1], p[0]))
            self.point_on_hull = self.start_point
            self.hull_points = [self.start_point]
            self.current_point = None
            return False

        if len(self.hull_points) > 1 and np.array_equal(self.point_on_hull, self.hull_points[0]):
            self.hull_points = np.array(self.hull_points)
            return True

        next_point = None
        for p in self.points:
            if np.array_equal(p, self.point_on_hull):
                continue

            if next_point is None:
                next_point = p
                continue

            o = self.orientation(self.point_on_hull, next_point, p)
            if o == 2:
                next_point = p
            elif o == 0:
                dist_next = np.linalg.norm(np.array(next_point) - np.array(self.point_on_hull))
                dist_p = np.linalg.norm(np.array(p) - np.array(self.point_on_hull))
                if dist_p > dist_next:
                    next_point = p

        self.current_point = next_point

        if next_point is not None:
            self.point_on_hull = next_point
            self.hull_points.append(next_point)

        return False

    def update_plot(self, frame):
        self.ax.clear()

        if len(self.points) > 0:
            points_array = np.array(self.points)
            self.ax.scatter(points_array[:, 0], points_array[:, 1],
                          c='#2196F3', label='Points', s=100, alpha=0.5)

        if len(self.hull_points) > 0:
            hull_array = np.array(self.hull_points)
            self.ax.scatter(hull_array[:, 0], hull_array[:, 1],
                           c='#FFC107', s=150, label='Hull Points')

            if len(hull_array) > 1:
                for i in range(len(hull_array) - 1):
                    self.ax.plot([hull_array[i, 0], hull_array[i+1, 0]],
                               [hull_array[i, 1], hull_array[i+1, 1]],
                               color='#FFC107', linestyle='-', linewidth=2)

        if self.current_point is not None:
            self.ax.scatter([self.current_point[0]], [self.current_point[1]],
                           c='#4CAF50', s=200, label='Current Point', marker='*')

        if self.point_on_hull is not None and self.current_point is not None:
            self.ax.plot([self.point_on_hull[0], self.current_point[0]],
                        [self.point_on_hull[1], self.current_point[1]],
                        color='#9C27B0', linestyle='--', linewidth=1, label='Current Edge Check')

        if self.start_point is not None:
            self.ax.scatter([self.start_point[0]], [self.start_point[1]],
                           c='#4CAF50', s=200, label='Start Point', marker='o')

        if isinstance(self.hull_points, np.ndarray) and len(self.hull_points) > 2:
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

        if len(self.points) >= 3:
            self.step_algorithm()

        plt.draw()

    def add_point(self, event):
        try:
            coords = self.text_box.text.split()
            if len(coords) != 2:
                return
            x, y = map(float, coords)
            self.points.append([x, y])
            self.hull_points = None
            self.initialize_algorithm()
            self.update_plot(0)
            self.text_box.set_val('')
            plt.draw()
        except ValueError:
            pass

    def remove_last_point(self, event):
        if self.points:
            self.points.pop()
            self.hull_points = None
            self.initialize_algorithm()
            self.update_plot(0)
            plt.draw()

 