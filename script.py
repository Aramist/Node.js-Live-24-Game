filename = input()
file = open(filename, "r")
processed = open("P" + filename, "w")
for line in file:
    line = line.replace("  ", " ")
    s_1 = line.split(":")
    s_2 = s_1[0].strip().split(" ")
    s_3 = [int(s_4) for s_4 in s_2]
    s_5 = "[" + s_1[1].strip() + "]"
    processed.write(str(s_3[0]) + "," +
        str(s_3[1]) + "," +
        str(s_3[2]) + "," +
        str(s_3[3]) + ":" + s_5 + "\n")
file.close()
processed.close()
print("done!")
