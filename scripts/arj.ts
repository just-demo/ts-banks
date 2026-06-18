import files from './files';

export default {
    unpack(arjContent: Buffer): Promise<Buffer> {
        // TODO: extract single file from .arj package, could not find any javascript based solution for that
        return files.readRaw('../data/arj/RCUKRU.DBF');
    }
};
