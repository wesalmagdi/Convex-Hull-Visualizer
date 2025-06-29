import matplotlib.pyplot as plt
from matplotlib.widgets import Button
from convex_hull import BaseConvexHullVisualizer

from graham_scan import GrahamScanVisualizer
from gift_wrapping import GiftWrappingVisualizer
from andrews_monotone import AndrewsMonotoneVisualizer

import pygame
import os

class AlgorithmSelector:
    def __init__(self):
        plt.rcParams['toolbar'] = 'None'

        plt.style.use('dark_background')
        self.fig, self.ax = plt.subplots(figsize=(10, 8))
        self.fig.patch.set_facecolor('#1E1E1E')
        
        pygame.mixer.init()
        self.pew_sound = None
        if os.path.exists('../assets/bonk doge.mp3'):
            try:
                self.pew_sound = pygame.mixer.Sound('../assets/bonk doge.mp3')
            except Exception as e:
                print(f"Could not load bonk doge sound: {e}")
        
        button_height = 0.12
        button_width = 0.4
        button_positions = [(0.3, 0.6), (0.3, 0.45), (0.3, 0.3)]
        button_texts = ["Graham's Scan", 'Gift Wrapping', "Andrew's Monotone"]
        button_colors = ['#4CAF50', '#FFC107', '#9C27B0']
        button_algorithms = ['graham', 'giftwrap', 'andrews']
        
        self.menu_axes = []
        self.menu_buttons = []
        for pos, text, color, algo in zip(button_positions, button_texts, button_colors, button_algorithms):
            ax = self.fig.add_axes([pos[0], pos[1], button_width, button_height])
            btn = Button(ax, text, color=color, hovercolor='#666666')
            btn.on_clicked(lambda x, a=algo: self.start_algorithm_with_sound(a))
            self.menu_axes.append(ax)
            self.menu_buttons.append(btn)
        
        quit_ax = self.fig.add_axes([0.4, 0.05, 0.2, 0.08])
        self.quit_button = Button(quit_ax, 'Quit', color='#F44336', hovercolor='#666666')
        self.quit_button.on_clicked(self.quit)
        self.menu_axes.append(quit_ax)
        self.menu_buttons.append(self.quit_button)

        self.selected_algorithm = None
        self.current_visualizer = None
        
        self.show_main_menu()

    def play_pew_sound(self):
        if self.pew_sound:
            try:
                self.pew_sound.play()
            except Exception as e:
                print(f"Could not play pew sound: {e}")

    def show_main_menu(self):
        self.ax.clear()
        self.ax.set_facecolor('#2D2D2D')
        self.ax.set_title('Convex Hull Algorithm Visualizer', pad=20, fontsize=16, color='white')
        self.ax.axis('off')
        description = "Select an algorithm to visualize the convex hull computation:"
        self.ax.text(0.5, 0.9, description, ha='center', va='center', fontsize=12, color='#CCCCCC')
        
        for ax in self.menu_axes:
            ax.set_visible(True)
        for button in self.menu_buttons:
            button.set_active(True)
        
        self.fig.canvas.draw_idle()

    def hide_main_menu(self):
        for ax in self.menu_axes:
            ax.set_visible(False)
        for button in self.menu_buttons:
            button.set_active(False)
        
        self.fig.canvas.draw_idle()

    def start_algorithm_with_sound(self, algorithm):
        self.play_pew_sound()
        self.start_algorithm(algorithm)

    def start_algorithm(self, algorithm):
        self.selected_algorithm = algorithm
        self.hide_main_menu()
        self.ax.clear()
        self.ax.set_visible(True)
        self.ax.set_facecolor('#2D2D2D')
        
        visualizer_classes = {
            'graham': GrahamScanVisualizer,
            'giftwrap': GiftWrappingVisualizer,
            'andrews': AndrewsMonotoneVisualizer,
        }
        VisualizerClass = visualizer_classes.get(algorithm)
        
        if VisualizerClass:
            self.current_visualizer = VisualizerClass(fig=self.fig, ax=self.ax, back_callback=self.show_main_menu)
            self.current_visualizer.visualize()
            
    def quit(self, event):
        plt.close('all')
        self.selected_algorithm = 'quit'

    def show(self):
        plt.show()
        return self.selected_algorithm

def main():
    selector = AlgorithmSelector()
    selector.show()

if __name__ == "__main__":
    main() 