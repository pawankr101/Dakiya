
pub trait List<T> {
    fn size(&self) -> usize;
    fn get(&self, index: usize) -> Option<&T>;
    fn push(&mut self, item: T) -> &mut Self;
    fn pop(&mut self) -> Option<T>;
    fn insert(&mut self, index: usize, item: T) -> &mut Self;
    fn remove(&mut self, index: usize) -> Option<T>;
}

pub type ListType<T> = dyn List<T>;
pub struct ArrayList<T> {
    data: Vec<T>,
}
impl<T> ArrayList<T> {
    pub fn new() -> Self {
        ArrayList { data: Vec::new() }
    }
}
impl <T: Copy> List<T> for ArrayList<T> {
    fn size(&self) -> usize {
        self.data.len()
    }

    fn get(&self, index: usize) -> Option<&T> {
        self.data.get(index)
    }

    fn push(&mut self, item: T) -> &mut Self {
        self.data.push(item);
        self
    }

    fn pop(&mut self) -> Option<T> {
        self.data.pop()
    }

    fn insert(&mut self, index: usize, item: T) -> &mut Self {
        self.data.insert(index, item);
        self
    }

    fn remove(&mut self, index: usize) -> Option<T> {
        if index < self.data.len() {
            Some(self.data.remove(index))
        } else {
            None
        }
    }
}
