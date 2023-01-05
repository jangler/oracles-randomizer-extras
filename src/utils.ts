// utility functions

export { isFirstInstance };

// useful with .filter() to get unique values
function isFirstInstance<T>(value: T, index: number, array: T[]): boolean {
    return array.indexOf(value) === index;
}
