# Convex Hull Algorithm Visualizer

This project implements and visualizes three popular convex hull algorithms with an interactive interface. The visualizer allows users to dynamically add points and watch the algorithms compute the convex hull in real-time.

## Features

- **Interactive Visualization**: Real-time visualization of convex hull algorithms
- **Multiple Algorithms**: Graham's Scan, Gift Wrapping (Jarvis March), and Andrew's Monotone Chain
- **Dynamic Point Management**: Add and remove points during visualization
- **Audio Feedback**: Sound effects for button interactions and optional background music
- **User-Friendly Interface**: Intuitive controls with visual feedback

## Algorithms Implemented

1. **Graham's Scan**: O(n log n) time complexity, uses polar angle sorting
2. **Gift Wrapping (Jarvis March)**: O(nh) time complexity where h is the number of hull points
3. **Andrew's Monotone Chain**: O(n log n) time complexity, efficient implementation

## Installation

1. Clone or download this repository
2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Running the Visualizer

To start the interactive visualizer:
```bash
cd src
python main.py
```

### How to Use

1. **Main Menu**: Select one of the three convex hull algorithms
2. **Adding Points**: Enter coordinates in "x y" format (e.g., "3 5") and click "Add Point" or press Enter
3. **Minimum Points**: Add at least 3 points to form a convex hull
4. **Starting Algorithm**: Click "Start" to begin the visualization
5. **Controls**:
   - **Add Point**: Add a new point to the set
   - **Remove Last**: Remove the most recently added point
   - **Reset**: Clear all points and start over
   - **Start**: Begin or restart the algorithm
   - **Stop**: Pause the current algorithm
   - **Back**: Return to algorithm selection menu

### Audio Features

- **Sound Effects**: Button clicks trigger sound effects
- **Background Music**: Optional background music plays during algorithm execution
- **Audio Files**: The project includes several audio files for enhanced user experience

## Project Structure

```
convex-hull-visualizer/
│
├── src/
│   ├── main.py                 # Main application entry point
│   ├── convex_hull.py          # Base class for visualizers
│   ├── graham_scan.py          # Graham's Scan implementation
│   ├── gift_wrapping.py        # Gift Wrapping implementation
│   └── andrews_monotone.py     # Andrew's Monotone Chain implementation
│
├── assets/
│   ├── Screenshot 2025-05-31 031633.png
│   ├── background_music.mp3
│   ├── spongebob-fail.mp3
│   ├── pew.mp3
│   ├── bonk doge.mp3
│   └── na na na.mp3
│
├── requirements.txt            # Python dependencies
├── LICENSE                     # MIT License
└── README.md                   # This file
```

## Requirements

- Python 3.7+
- numpy >= 1.21.0
- matplotlib >= 3.4.0
- pygame >= 2.0.0
- scipy >= 1.7.0

## Technical Details

- Built with matplotlib for visualization
- Pygame for audio handling
- Object-oriented design with inheritance for algorithm implementations
- Real-time animation using matplotlib's FuncAnimation
- Responsive UI with dynamic point management

## Contributing

Feel free to contribute by:
- Adding new convex hull algorithms
- Improving the visualization interface
- Adding new features or optimizations
- Reporting bugs or issues 