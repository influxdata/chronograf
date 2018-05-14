// +build ignore

#include "tdigest.h"
#include <iostream>
#include <string>
#include <sstream>
#include <fstream>
#include <vector>
#include <iomanip>

using namespace tdigest;

double quantiles[7] = {
    0.1,
    0.2,
    0.5,
    0.75,
    0.9,
    0.99,
    0.999,
};


std::string dataFiles[3] = {"small.dat", "uniform.dat", "normal.dat"};
double cdfs[3][5] = {
    // small.dat
	{0, 1, 4, 5, 6},
    // uniform.dat
	{-1, 0, 50, 100, 101},
    // normal.dat
	{-100, 7, 10, 13, 110},
};


std::vector<double> loadData(std::string name) {
    std::ifstream f (name);
    std::vector<double> data;

    f >> std::setprecision(std::numeric_limits<long double>::digits10 + 1);
    double x;
    while (f >> x) {
        data.push_back(x);
    }
    return data;
}

TDigest* createTDigest(std::vector<double> data){
    TDigest* td = new TDigest(1000);
    for (auto x : data) {
        td->add(x);
    }
    return td;
}

std::vector<double> computeQuantiles(TDigest* td){
    std::vector<double> results;
    for (int i = 0; i < 7; i++) {
        double q = td->quantile(quantiles[i]);
        results.push_back(q);
    }
    return results;
}

std::vector<double> computeCDFs(TDigest* td, double cdfs[5]) {
    std::vector<double> results;
    for (int i = 0; i < 5; i++) {
        double p = td->cdf(cdfs[i]);
        results.push_back(p);
    }

    return results;
}

void writeResults(std::string name, std::vector<double> results){
    std::ofstream f (name);

    f << std::setprecision(std::numeric_limits<long double>::digits10 + 1);
    for (auto x : results) {
        f << x << std::endl;
    }
}

int main() {
    for (int i = 0; i < 3; i++) {
        std::vector<double> data = loadData(dataFiles[i]);
        TDigest* td = createTDigest(data);
        auto results = computeQuantiles(td);
        writeResults(dataFiles[i] + ".cpp.quantiles", results);
        results = computeCDFs(td, cdfs[i]);
        writeResults(dataFiles[i] + ".cpp.cdfs", results);
    }
    return 0;
}
