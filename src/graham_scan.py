import numpy as np
from convex_hull import BaseConvexHullVisualizer
import matplotlib.pyplot as plt

class GrahamScanVisualizer(BaseConvexHullVisualizer):
    def __init__(self, fig=None, ax=None, back_callback=None):
        super().__init__(fig=fig, ax=ax, back_callback=back_callback)
        self.sorted_points = None
        self.stack = None
        self.current_point = None
        self.current_step = 0
        
    def get_algorithm_name(self):
        return "Graham's Scan"
        
    def orientation(self, p, q, r):
        val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1])
        if val == 0:
            return 0
        return 1 if val > 0 else 2
    
    def initialize_algorithm(self):
        if len(self.points) < 3:
            self.sorted_points = None
            self.stack = None
            self.current_step = 0
            self.hull_points = None
            return
        
        start = min(self.points, key=lambda p: (p[1], p[0]))
        
        self.sorted_points = sorted(self.points, 
                                  key=lambda p: (np.arctan2(p[1] - start[1], p[0] - start[0]), 
                                               np.sqrt((p[0] - start[0])**2 + (p[1] - start[1])**2)))
        
        self.stack = [self.sorted_points[0], self.sorted_points[1]]
        self.current_step = 2
        self.current_point = self.sorted_points[1]
        self.hull_points = None
        
    def step_algorithm(self):
        if self.sorted_points is None or len(self.sorted_points) < 3:
            return True
            
        if self.current_step >= len(self.sorted_points):
            self.hull_points = np.array(self.stack)
            return True
        
        self.current_point = self.sorted_points[self.current_step]
        
        while len(self.stack) > 1 and self.orientation(self.stack[-2], self.stack[-1], self.current_point) != 2:
            self.stack.pop()
        
        self.stack.append(self.current_point)
        self.current_step += 1
        return False

    def remove_last_point(self, event):
        if self.points:
            self.points.pop()
            self.sorted_points = None
            self.stack = None
            self.hull_points = None
            self.current_step = 0
            self.current_point = None
            self.update_plot(0)
            plt.draw() 