import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import pygame
import time
import os
from matplotlib.widgets import TextBox, Button
from matplotlib.patches import Rectangle

class BaseConvexHullVisualizer:
    def __init__(self, fig=None, ax=None, back_callback=None):
        pygame.mixer.init()

        self.has_music = False
        self.music_file = '../assets/na na na.mp3'
        self.button_sounds = {}
        self.sound_files = {
            'pew': '../assets/bonk doge.mp3',
            'reset': '../assets/spongebob-fail.mp3'
        }
        
        for sound_name, sound_file in self.sound_files.items():
            if os.path.exists(sound_file):
                try:
                    self.button_sounds[sound_name] = pygame.mixer.Sound(sound_file)
                except Exception as e:
                    print(f"Could not load {sound_name} sound: {e}")
                    
        if os.path.exists(self.music_file):
            try:
                pygame.mixer.music.load(self.music_file)
                self.has_music = True
            except Exception as e:
                print(f"Could not load music: {e}")

        self.fig = fig if fig is not None else plt.figure(figsize=(10, 8))
        self.ax = ax if ax is not None else self.fig.add_subplot(111)
        self.back_callback = back_callback

        self.points = []
        self.points_array = None
        self.hull_points = None
        self.is_collecting_points = True
        self.animation = None
        self.is_music_playing = False

        self.widgets = []

        text_ax = self.fig.add_axes([0.05, 0.05, 0.15, 0.05])
        self.text_box = TextBox(
            text_ax,
            'Enter point (x y):',
            initial='',
            color='white',
            hovercolor='white',
            label_pad=0.1
        )
        self.text_box.text_disp.set_color('black')
        self.text_box.text_disp.set_fontsize(14)
        self.text_box.label.set_color('black')
        self.text_box.label.set_fontsize(14)
        self.text_box.ax.set_facecolor('white')
        self.text_box.on_submit(self.add_point)
        self.widgets.append(text_ax)

        add_ax = self.fig.add_axes([0.22, 0.05, 0.1, 0.05])
        self.add_button = Button(add_ax, 'Add Point', color='#4CAF50', hovercolor='#666666')
        self.add_button.on_clicked(self.add_point)
        self.widgets.append(add_ax)

        remove_ax = self.fig.add_axes([0.34, 0.05, 0.15, 0.05])
        self.remove_button = Button(remove_ax, 'Remove Last', color='#F44336', hovercolor='#666666')
        self.remove_button.on_clicked(self.remove_last_point)
        self.widgets.append(remove_ax)

        reset_ax = self.fig.add_axes([0.51, 0.05, 0.1, 0.05])
        self.reset_button = Button(reset_ax, 'Reset', color='#FF9800', hovercolor='#666666')
        self.reset_button.on_clicked(self.reset_points)
        self.widgets.append(reset_ax)

        start_ax = self.fig.add_axes([0.63, 0.05, 0.1, 0.05])
        self.start_button = Button(start_ax, 'Start', color='#2196F3', hovercolor='#666666')
        self.start_button.on_clicked(self.start_algorithm)
        self.widgets.append(start_ax)

        stop_ax = self.fig.add_axes([0.75, 0.05, 0.1, 0.05])
        self.stop_button = Button(stop_ax, 'Stop', color='#F44336', hovercolor='#666666')
        self.stop_button.on_clicked(self.stop_algorithm)
        self.widgets.append(stop_ax)

        back_ax = self.fig.add_axes([0.87, 0.05, 0.1, 0.05])
        self.back_button = Button(back_ax, 'Back', color='#9C27B0', hovercolor='#666666')
        self.back_button.on_clicked(self.go_back)
        self.widgets.append(back_ax)

        self.ax.set_facecolor('#2D2D2D')
        self.ax.grid(True, color='#444444', linestyle='--', alpha=0.3)
        self.ax.set_title('Convex Hull Visualization', pad=20, fontsize=14, color='white')

        instructions = (
            "Instructions:\n"
            "1. Enter point coordinates in the format 'x y'\n"
            "2. Click 'Add Point' or press Enter to add the point\n"
            "3. Add at least 3 points to form a convex hull\n"
            "4. Click 'Start' to begin the algorithm\n"
            "5. Click 'Stop' to stop the algorithm and music\n"
            "6. Click 'Remove Last' to remove the last point\n"
            "7. Click 'Reset' to clear all points\n"
            "8. Click 'Back' to return to algorithm selection"
        )

        self.ax.text(0.02, 0.98, instructions,
                    transform=self.ax.transAxes,
                    verticalalignment='top',
                    fontsize=9,
                    color='black',
                    bbox=dict(facecolor='#2D2D2D',
                            alpha=0.8,
                            edgecolor='#444444',
                            boxstyle='round,pad=0.5'))

    def stop_music(self):
        if self.is_music_playing:
            pygame.mixer.music.stop()
            self.is_music_playing = False

    def stop_algorithm(self, event):
        self.play_button_sound('pew')
        self.stop_music()
        if self.animation is not None:
            self.animation.event_source.stop()
            self.animation = None
        plt.draw()

    def play_button_sound(self, sound_type='pew'):
        if sound_type in self.button_sounds and self.button_sounds[sound_type]:
            try:
                self.button_sounds[sound_type].play()
            except Exception as e:
                print(f"Could not play {sound_type} sound: {e}")

    def reset_points(self, event):
        self.stop_music()
        self.play_button_sound('reset')
        self.points = []
        self.points_array = None
        self.hull_points = None
        self.initialize_algorithm()
        self.update_plot(0)
        plt.draw()

    def get_algorithm_name(self):
        raise NotImplementedError("Subclasses must implement get_algorithm_name")

    def initialize_algorithm(self):
        raise NotImplementedError("Subclasses must implement initialize_algorithm")

    def step_algorithm(self):
        raise NotImplementedError("Subclasses must implement step_algorithm")

    def go_back(self, event):
        self.stop_music()
        self.play_button_sound('pew')
        if self.animation is not None:
            self.animation.event_source.stop()
        self.ax.clear()
        for widget_ax in [self.text_box.ax, self.add_button.ax, self.remove_button.ax, 
                         self.start_button.ax, self.back_button.ax, self.reset_button.ax,
                         self.stop_button.ax]:
            widget_ax.set_visible(False)
        self._clear_widgets()
        if self.back_callback:
            self.back_callback()

    def add_point(self, event):
        self.stop_music()
        self.play_button_sound('pew')
        try:
            coords = self.text_box.text.split()
            if len(coords) != 2:
                return

            x, y = map(float, coords)
            self.points.append([x, y])
            self.update_plot(0)
            self.text_box.set_val('')
            plt.draw()
        except ValueError:
            pass

    def remove_last_point(self, event):
        self.stop_music()
        self.play_button_sound('pew')
        if self.points:
            self.points.pop()
            self.update_plot(0)
            plt.draw()

    def start_algorithm(self, event):
        self.play_button_sound('pew')
        if len(self.points) < 3:
            print("Need at least 3 points to start algorithm.")
            return

        self.points_array = np.array(self.points)

        if self.animation is not None:
            self.animation.event_source.stop()

        self.hull_points = None
        self.initialize_algorithm()

        if self.has_music and not self.is_music_playing:
            try:
                pygame.mixer.music.play(-1)
                self.is_music_playing = True
            except Exception as e:
                print(f"Could not play music: {e}")

        self.animation = FuncAnimation(self.fig, self.update_plot,
                                     interval=500,
                                     repeat=False)
        plt.draw()

    def update_plot(self, frame):
        self.ax.clear()

        if len(self.points) > 0:
            points_array = np.array(self.points)
            self.ax.scatter(points_array[:, 0], points_array[:, 1],
                          c='#2196F3', label='Points', s=100)

        if hasattr(self, 'current_point') and self.current_point is not None:
             self.ax.scatter([self.current_point[0]], [self.current_point[1]],
                           c='#4CAF50', s=200, label='Current Point', marker='*')

        if hasattr(self, 'stack') and self.stack is not None:
            stack_points = np.array(self.stack)
            self.ax.scatter(stack_points[:, 0], stack_points[:, 1],
                          c='#FFC107', s=100, label='Hull Points')

            if len(self.stack) > 1:
                for i in range(len(self.stack) - 1):
                    self.ax.plot([self.stack[i][0], self.stack[i+1][0]],
                               [self.stack[i][1], self.stack[i+1][1]],
                               color='#FFC107', linestyle='-', linewidth=2)

        if self.hull_points is not None:
            hull = np.vstack((self.hull_points, self.hull_points[0]))
            self.ax.plot(hull[:, 0], hull[:, 1],
                        color='#4CAF50', linestyle='-',
                        linewidth=2, label='Final Hull')

        self.ax.set_title(f'Convex Hull using {self.get_algorithm_name()}',
                         pad=20, fontsize=14, color='white')
        self.ax.legend(loc='upper right', facecolor='#2D2D2D',
                      edgecolor='#444444', labelcolor='white')
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

    def visualize(self):
        plt.show()

    def _clear_widgets(self):
        for widget in self.widgets:
            try:
                widget.ax.remove()
            except Exception:
                pass
        self.widgets = []

    def orientation(self, p, q, r):
        val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1])
        if val == 0:
            return 0
        elif val > 0:
            return 1
        else:
            return 2