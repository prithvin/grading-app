// Prithvi Narasimhan
// 8/22/2013
// Prompt.java
// Provide some utilities for user input. We want to enhance the Scanner class so that 
// our programs can recover from "bad" input, and also provide a way to limit numerical 
// input to a range of values.

import java.util.Scanner;

public class Prompt {

	public static String getString (String ask) {
		Scanner keyboard = new Scanner(System.in);
		System.out.print(ask);
		String input = keyboard.nextLine();
		return input;
	}
	
	public static int getInt (String ask) {
		boolean badinput = false;
		String input = new String("");
		int value = 0;
		do {
			badinput = false;
			input = getString(ask);
			try {
				value = Integer.parseInt(input);
			}
			catch (NumberFormatException e){
				badinput = true;
			}
		} while (badinput);
		return value;
	}
	
	public static int getInt (String ask, int min, int max) {
		int value = 0;
		do {
			value = getInt(ask + "\t(" + min + " - " + max + ") --> ");
		} while (value < min || value > max);
		return value;
	}
	
	public static double getDouble (String ask) {
		boolean badinput = false;
		String input = new String("");
		double value = 0.0;
		do {
			badinput = false;
			input = getString(ask);
			try {
				value = Double.parseDouble(input);
			}
			catch (NumberFormatException e){
				badinput = true;
			}
		} while (badinput);
		return value;
	}
	
	public static double getDouble (String ask, double min, double max) {
		double value = 0;
		String minstring= String.format("%.2f", min);
		String maxstring = String.format("%.2f", max);
		do {
			value = getDouble(ask + "\t(" + minstring + " - " + maxstring + ") --> ");
		} while (value < min || value > max);
		return value;
	}
	
}