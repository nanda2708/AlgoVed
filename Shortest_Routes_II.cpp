#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m, q;
    cin >> n >> m >> q;

    vector<vector<long long>> grid(n+10, vector<long long>(n+10, 1e15));
    for (long long i = 1; i <= m; i++) {
        long long u, v, c;
        cin >> u >> v >> c;
        grid[u][v] = c;
        grid[v][u] = c;
    }
    for (long long i = 1; i <= n; i++) {
        grid[i][i] = 0; // Distance to self is zero
    }
    for(long long k = 1;k<=n;k++){
        for(long long i = 1;i<=n;i++){
            for(long long j = 1;j<=n;j++){
                grid[i][j] = min(grid[i][j], grid[i][k] + grid[k][j]);
            }
        }
    }

    while (q--) {
        long long u, v;
        cin >> u >> v;
        if (grid[u][v] >= 1e15/2) {
            cout << -1 << endl;
        } else {
            cout << grid[u][v] << endl;
        }
    }
}