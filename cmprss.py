#!/usr/bin/env python3
import csv
import numpy as np

for subject in [2,3,4,5,6,7,8,9,10,11,13,14,15,16,17]:
#for subject in [17]:
	subj = str(subject)  # here we set the subject to compress
	# arbitrarily skipped datapoints and quantization, just to test
	skipSize = 5; quant = 100
	numChannels = 8  # eight sensors in respiban
	print(subj)

	# read respiban CSV file
	with open('S'+subj+'_respiban.txt') as f:
		reader = csv.reader(f, delimiter = '\t')
		adata = list(reader)
	# open the SXX_quest.csv file and obtain the study protocol conditions:
	with open('S'+subj+'_quest.csv') as f:
		reader = csv.reader(f, delimiter = ';')
		anns = list(reader)
	indx = []  # storage for the start indices
	clss = []  # storage for the class
	i = 1
	while (anns[2][i] != ''):
		start = anns[2][i].split('.')
		start[0] = int(start[0])*(700*60/skipSize)
		if len(start)>1:
			start[1] = start[1].zfill(2)  # zero-pad to fix left out zeros for the seconds
			start[0] += int(start[1])*(700/skipSize)
		stopt = anns[3][i].split('.')
		stopt[0] = int(stopt[0])*(700*60/skipSize)
		if len(stopt)>1:
			stopt[1] = stopt[1].zfill(2)  # zero-pad to fix left out zeros for the seconds
			stopt[0] += int(stopt[1])*(700/skipSize)
		clss.append(anns[1][i])
		indx.append(start[0])
		clss.append('null')
		indx.append(stopt[0])
		i+=1;
	# read the E4 csv files:
	with open('./S'+subj+'/S'+subj+'_E4_Data/ACC.csv') as f:
		reader = csv.reader(f, delimiter = ',')
		e4acc = list(reader); e4acc_t = e4acc[0]; e4acc_hz = e4acc[1]
	with open('./S'+subj+'/S'+subj+'_E4_Data/BVP.csv') as f:
		reader = csv.reader(f, delimiter = ',')
		e4bvp = list(reader); e4bvp_t = e4bvp[0]; e4bvp_hz = e4bvp[1]
	with open('./S'+subj+'/S'+subj+'_E4_Data/EDA.csv') as f:
		reader = csv.reader(f, delimiter = ',')
		e4eda = list(reader); e4eda_t = e4eda[0]; e4eda_hz = e4eda[1]
	with open('./S'+subj+'/S'+subj+'_E4_Data/HR.csv') as f:
		reader = csv.reader(f, delimiter = ',')
		e4hr = list(reader); e4hr_t = e4hr[0]; e4hr_hz = e4hr[1]
	with open('./S'+subj+'/S'+subj+'_E4_Data/IBI.csv') as f:
		reader = csv.reader(f, delimiter = ',')
		e4ibi = list(reader); e4ibi_t = e4ibi[0]; e4ibi_hz = e4ibi[1]
	with open('./S'+subj+'/S'+subj+'_E4_Data/TEMP.csv') as f:
		reader = csv.reader(f, delimiter = ',')
		e4tmp = list(reader); e4tmp_t = e4tmp[0]; e4tmp_hz = e4tmp[1]

	# create and fill data structure:
	sensors = np.zeros([numChannels,int(len(adata)/skipSize)])  # add one extra (might be left 0)
	i=0
	for row in adata[3:-1:skipSize]:
		for sensor in range(2,10):  # columns 3-11 contain the sensor values
			try:
				sensors[sensor-2][i] = row[sensor]  # (float(row[sensor])*quant)
			except:
				print("Error value:"+str(row[sensor+1]))
				sensors[sensor-2][i] = 0
		i+=1

	# get minima, maxima, iqr:
	m = np.zeros([numChannels,2])
	for i in range(numChannels):
		m[i][0] = int( np.percentile(sensors[i], .001 ) )  # min(sensors[i])
		m[i][1] = int( np.percentile(sensors[i], 99.99) ) # max(sensors[i])
	# adjust channels in plot:
	for i in range(len(sensors[0])):
		for channel in range(numChannels):
			sensors[channel][i] =  int( quant* ((sensors[channel][i]-m[channel][0])/(m[channel][1]-m[channel][0]) - 0.5) )
			sensors[channel][i] += 100*(channel)

	# write to file:
	with open('dta'+subj+'.js',"w") as f:
		i=0
		for sensor in ["ecg","eda","emg","tmp","acx","acy","acz","rsp"]:
			f.write("var "+sensor+"=[")
			f.write(",".join( list( map (str, [int(x) for x in sensors[i][:-2] ]) ) ) )  # -2: remove last potential 0*
			f.write("];\n")
			i+=1
		f.write("var pos=[")
		f.write(",".join( list( map (str, indx) ) ) )
		f.write("];\n")
		f.write("var lbl=['")
		f.write("','".join( clss ) )
		f.write("'];\n")
		f.write("var e4bvp=[")
		f.write(",".join( list( map (str, [int(400+float(x[0])/4) for x in e4bvp[2:] ]) ) ) )
		f.write("];\n")
		f.write("var e4acx=[")
		f.write(",,".join( list( map (str, [int(200+float(x[0])) for x in e4acc[2:] ]) ) ) )
		f.write("];\n")
		f.write("var e4acy=[")
		f.write(",,".join( list( map (str, [int(200+float(x[1])) for x in e4acc[2:] ]) ) ) )
		f.write("];\n")
		f.write("var e4acz=[")
		f.write(",,".join( list( map (str, [int(200+float(x[2])) for x in e4acc[2:] ]) ) ) )
		f.write("];\n")
		f.write("var e4eda=[")
		f.write(",,,,,,,,,,,,,,,,".join( list( map (str, [int(650+float(x[0])) for x in e4eda[2:] ]) ) ) )
		f.write("];\n")
		f.write("var e4tmp=[")
		f.write(",,,,,,,,,,,,,,,,".join( list( map (str, [int(float(x[0])) for x in e4tmp[2:] ]) ) ) )
		f.write("];\n")
		f.write("var e4hr=[")
		f.write(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,".join( list( map (str, [int(490+float(x[0])) for x in e4hr[2:] ]) ) ) )
		f.write("];\n")
