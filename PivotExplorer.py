import anywidget
import traitlets

import ipywidgets as widgets
from ipydatagrid import DataGrid

import pandas as pd
import pathlib


class PivotSelectWidget(anywidget.AnyWidget):

    # Widget front-end JavaScript code    
    _esm = pathlib.Path("./static/pivot_explorer.js")

    def __init__(self):
        super().__init__(layout=widgets.Layout(display='flex', align_items='stretch', width='35%'))
        self.observe(self.on_grouping_change, names=["grouping_columns", "agg_columns"])

    def on_grouping_change(self, change):
        naggs = {}
        agg_dict = self.agg_columns

        if ( (len(self.grouping_columns) == 0) and (len(self.agg_columns) == 0) ):
            self.dgrid.data = self.df
        elif (len(self.grouping_columns) == 0):
            for k,v in agg_dict.items():
                naggs[k+"_"+v] = pd.NamedAgg(k,v)
            agg_df = self.df.agg(**naggs)
            agg_df['value'] = agg_df.agg('sum', axis=1)
            agg_df.index.rename('aggregation', inplace=True)
            self.dgrid.data = agg_df[['value']]
        elif (len(agg_dict) == 0):
            self.dgrid.data = self.df.groupby(self.grouping_columns).size().to_frame()
        else:
            for k,v in agg_dict.items():
                naggs[k+"_"+v] = pd.NamedAgg(k,v)
            self.dgrid.data = self.df.groupby(self.grouping_columns).agg(**naggs)

    
    # Stateful property that can be accessed by JavaScript & Python
    columns = traitlets.List().tag(sync=True)
    display_columns = traitlets.List().tag(sync=True)
    grouping_columns = traitlets.List().tag(sync=True) # Would prefer Set, but it causes TypeError: Set is not serializable
    agg_columns = traitlets.Dict().tag(sync=True)

    dgrid = None;
    df = None;


def PivotExplorer(df):
    psw = PivotSelectWidget()

    dg = widgets.VBox([DataGrid(df, auto_fit_columns = True)],
                      layout=widgets.Layout(display='flex', align_items='stretch', width='60%'))

    psw.columns = df.columns.to_list()
    psw.dgrid = dg.children[0]
    psw.df = df

    pvtexp = widgets.HBox([psw, dg])
    return pvtexp
